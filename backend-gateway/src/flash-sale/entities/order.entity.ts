import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'idempotency_key', unique: true, length: 255 })
  idempotencyKey!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'product_id' })
  productId!: string;

  @Column({ name: 'customer_ref', length: 255 })
  customerRef!: string;

  @Column()
  quantity!: number;

  @Column({ length: 20 })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
