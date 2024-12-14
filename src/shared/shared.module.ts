import { Module } from '@nestjs/common';
import { PubSubService } from './pubSub.service';

@Module({
  providers: [PubSubService],
  exports: [PubSubService],
})
export class SharedModule {}
