import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class CommonTimestamp {
  @Prop({ required: false })
  timestamp?: number;
}

class RetryStatus extends CommonTimestamp {
  @Prop({ required: false })
  isRetry?: boolean;
}

class QueuedStatus extends CommonTimestamp {
  @Prop()
  isQueued: boolean;
}

class SentStatus extends CommonTimestamp {
  @Prop()
  isSent: boolean;
}

class DeliveredStatus extends CommonTimestamp {
  @Prop({ required: false })
  isDelivered?: boolean;
}

class ReadStatus extends CommonTimestamp {
  @Prop({ required: false })
  isRead?: boolean;
}

class CommonId {
  @Prop()
  _id: string;
}

class Sender extends CommonId {
  @Prop({ type: RetryStatus, required: false })
  retryStatus?: RetryStatus;

  @Prop({ type: QueuedStatus })
  queuedStatus: QueuedStatus;

  @Prop({ type: SentStatus })
  sentStatus: SentStatus;
}

class OtherMember extends CommonId {
  @Prop({ type: DeliveredStatus, required: false })
  deliveredStatus?: DeliveredStatus;

  @Prop({ type: ReadStatus, required: false })
  readStatus?: ReadStatus;
}

@Schema({ timestamps: true })
export class Message extends CommonTimestamp {
  @Prop()
  chatId: Types.ObjectId;

  @Prop({ required: false })
  queueId?: string;

  @Prop()
  message: string;

  @Prop({ type: Sender })
  sender: Sender;

  @Prop({ type: [OtherMember] })
  otherMembers: OtherMember[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = Message & Document & SchemaTimestampsConfig;
