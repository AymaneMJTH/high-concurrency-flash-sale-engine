import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn()
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'api_key_hash', length: 255, unique: true })
  apiKeyHash!: string;

  @Column({ name: 'webhook_url', length: 500, nullable: true })
  webhookUrl!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
