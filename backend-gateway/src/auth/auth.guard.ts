import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const tenant = await this.dataSource.query(
      'SELECT id, name FROM tenants WHERE api_key_hash = $1',
      [apiKeyHash],
    );

    if (!tenant || tenant.length === 0) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.tenant = {
      id: tenant[0].id,
      name: tenant[0].name,
    };

    return true;
  }

  private extractApiKey(request: any): string | undefined {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return request.headers['x-api-key'];
  }
}
