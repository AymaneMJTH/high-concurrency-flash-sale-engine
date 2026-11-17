import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryColumn()
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ length: 100 })
  sku!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'total_stock' })
  totalStock!: number;

  @Column({ name: 'available_stock' })
  availableStock!: number;

  @Column()
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
