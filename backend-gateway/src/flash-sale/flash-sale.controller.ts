import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { FlashSaleService } from './flash-sale.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('flash-sale')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Post('checkout')
  async checkout(@Body() createOrderDto: CreateOrderDto) {
    const tenantId = 'tenant_1';
    return this.flashSaleService.checkout(tenantId, createOrderDto);
  }

  @Get('status/:productId')
  async getStatus(@Param('productId') productId: string) {
    return this.flashSaleService.getStatus(productId);
  }

  @Post('restock')
  async restock(@Body() body: { productId: string; quantity: number }) {
    return this.flashSaleService.restock(body.productId, body.quantity);
  }

  @Get('orders')
  async getOrders() {
    return this.flashSaleService.getOrders();
  }
}
