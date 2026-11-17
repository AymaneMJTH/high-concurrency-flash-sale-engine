import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface OrderCreatedEvent {
  id: string;
  idempotencyKey: string;
  tenantId: string;
  productId: string;
  customerRef: string;
  quantity: number;
  status: string;
}

@Injectable()
export class OrderConsumerService {
  private readonly logger = new Logger(OrderConsumerService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent, @Ctx() context: RmqContext) {
    const { id, idempotencyKey, tenantId, productId, customerRef, quantity, status } = data;

    this.logger.log(`Processing order_created event: ${id}`);

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingOrder = await queryRunner.manager.query(
        `SELECT id, status FROM orders WHERE idempotency_key = $1 AND tenant_id = $2`,
        [idempotencyKey, tenantId],
      );

      if (existingOrder && existingOrder.length > 0) {
        this.logger.log(`Order already exists with idempotency key: ${idempotencyKey}`);
        await queryRunner.rollbackTransaction();
        channel.ack(originalMsg);
        return;
      }

      await queryRunner.manager.query(
        `INSERT INTO orders (id, idempotency_key, tenant_id, product_id, customer_ref, quantity, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [id, idempotencyKey, tenantId, productId, customerRef, quantity, status],
      );

      await queryRunner.manager.query(
        `UPDATE products 
         SET available_stock = available_stock - $1, version = version + 1 
         WHERE id = $2`,
        [quantity, productId],
      );

      await queryRunner.manager.query(
        `INSERT INTO inventory_logs (id, product_id, order_id, change_amount, reason, created_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, 'ORDER_PLACED', CURRENT_TIMESTAMP)`,
        [productId, id, -quantity],
      );

      await queryRunner.commitTransaction();
      this.logger.log(`Order ${id} successfully persisted to PostgreSQL`);
      channel.ack(originalMsg);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to persist order ${id}: ${error.message}`, error.stack);
      channel.nack(originalMsg, false, false);
    } finally {
      await queryRunner.release();
    }
  }
}
