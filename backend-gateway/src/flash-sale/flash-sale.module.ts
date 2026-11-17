import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FlashSaleController } from './flash-sale.controller';
import { FlashSaleService } from './flash-sale.service';
import { OrderConsumerService } from './order-consumer.service';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { InventoryLog } from './entities/inventory-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Order, InventoryLog]),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'orders_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [FlashSaleController],
  providers: [FlashSaleService, OrderConsumerService],
})
export class FlashSaleModule {}
