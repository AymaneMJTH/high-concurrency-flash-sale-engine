import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private redis: Redis;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    });
  }

  async check() {
    const postgresStatus = await this.checkPostgres();
    const redisStatus = await this.checkRedis();

    const isHealthy = postgresStatus.status === 'up' && redisStatus.status === 'up';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        postgres: postgresStatus,
        redis: redisStatus,
      },
    };
  }

  private async checkPostgres() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async checkRedis() {
    try {
      const result = await this.redis.ping();
      return { status: result === 'PONG' ? 'up' : 'down' };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }
}
