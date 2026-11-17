import { Injectable, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import Redis from 'ioredis';

export interface OrderResponse {
  id: string;
  idempotencyKey: string;
  productId: string;
  customerRef: string;
  quantity: number;
  status: string;
}

@Injectable()
export class FlashSaleService {
  private redis: Redis;

  private readonly STOCK_DECREMENT_LUA = `
    local stockKey = KEYS[1]
    local quantity = tonumber(ARGV[1])
    local currentStock = tonumber(redis.call('GET', stockKey) or '0')
    
    if currentStock < quantity then
      return {0, currentStock}
    end
    
    local newStock = redis.call('DECRBY', stockKey, quantity)
    return {1, newStock}
  `;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });

    this.redis.defineCommand('decrementStock', {
      numberOfKeys: 1,
      lua: this.STOCK_DECREMENT_LUA,
    });
  }

  async checkout(tenantId: string, createOrderDto: CreateOrderDto): Promise<OrderResponse> {
    const { idempotencyKey, productId, customerRef, quantity } = createOrderDto;

    const idempotencyKeyRedis = `idempotency:${tenantId}:${idempotencyKey}`;
    const stockRedisKey = `stock:${productId}`;

    const cachedOrder = await this.redis.get(idempotencyKeyRedis);
    if (cachedOrder) {
      return JSON.parse(cachedOrder);
    }

    const product = await this.dataSource.query(
      `SELECT id, available_stock FROM products WHERE id = $1 AND tenant_id = $2`,
      [productId, tenantId],
    );

    if (!product || product.length === 0) {
      throw new BadRequestException('Product not found');
    }

    await this.ensureStockInRedis(stockRedisKey, product[0].available_stock);

    const result = await (this.redis as any).decrementStock(stockRedisKey, quantity);
    const success = result[0] === 1;
    const remainingStock = result[1];

    if (!success) {
      throw new ConflictException('Insufficient stock - flash sale exhausted');
    }

    if (remainingStock < 0) {
      await this.redis.incrby(stockRedisKey, quantity);
      throw new ConflictException('Stock exhausted - transaction rejected');
    }

    const orderId = crypto.randomUUID();

    const orderEvent = {
      pattern: 'order_created',
      data: {
        id: orderId,
        idempotencyKey,
        tenantId,
        productId,
        customerRef,
        quantity,
        status: 'CONFIRMED',
      },
    };

    await this.rabbitClient.emit('order_created', orderEvent.data).toPromise();

    const orderResponse: OrderResponse = {
      id: orderId,
      idempotencyKey,
      productId,
      customerRef,
      quantity,
      status: 'CONFIRMED',
    };

    await this.redis.setex(idempotencyKeyRedis, 3600, JSON.stringify(orderResponse));

    return orderResponse;
  }

  async getProducts(tenantId: string) {
    const products = await this.dataSource.query(
      `SELECT id, sku, name, price, total_stock, available_stock, version 
       FROM products 
       WHERE tenant_id = $1`,
      [tenantId],
    );

    for (const product of products) {
      const stockRedisKey = `stock:${product.id}`;
      const redisStock = await this.redis.get(stockRedisKey);
      if (redisStock !== null) {
        product.available_stock = parseInt(redisStock, 10);
      }
    }

    return products;
  }

  private async ensureStockInRedis(key: string, dbStock: number): Promise<void> {
    const exists = await this.redis.exists(key);
    if (!exists) {
      await this.redis.set(key, dbStock);
    }
  }

  async syncStockToPostgres(productId: string): Promise<void> {
    const stockRedisKey = `stock:${productId}`;
    const redisStock = await this.redis.get(stockRedisKey);

    if (redisStock !== null) {
      await this.dataSource.query(
        `UPDATE products SET available_stock = $1 WHERE id = $2`,
        [parseInt(redisStock, 10), productId],
      );
    }
  }

  async getStatus(productId: string) {
    const stockRedisKey = `stock:${productId}`;
    const redisStock = await this.redis.get(stockRedisKey);

    const orderCountResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM orders WHERE product_id = $1 AND status = 'CONFIRMED'`,
      [productId],
    );

    const health = {
      redis: await this.checkRedisHealth(),
      postgres: await this.checkPostgresHealth(),
      rabbitmq: await this.checkRabbitMQHealth(),
    };

    return {
      productId,
      currentStock: redisStock ? parseInt(redisStock, 10) : 0,
      confirmedOrdersCount: parseInt(orderCountResult[0].count, 10),
      health,
    };
  }

  async restock(productId: string, quantity: number) {
    const stockRedisKey = `stock:${productId}`;
    await this.redis.set(stockRedisKey, quantity);
    return { productId, newStock: quantity };
  }

  async getOrders() {
    const orders = await this.dataSource.query(
      `SELECT id, product_id, customer_ref, quantity, status, created_at 
       FROM orders 
       WHERE status = 'CONFIRMED' 
       ORDER BY created_at DESC 
       LIMIT 50`,
    );
    return orders;
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async checkPostgresHealth(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async checkRabbitMQHealth(): Promise<boolean> {
    try {
      // Check if RabbitMQ client is connected by attempting to connect
      await this.rabbitClient.connect();
      return true;
    } catch {
      return false;
    }
  }
}
