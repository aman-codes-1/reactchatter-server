import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class CommonTimestamp {
  @Prop({ type: Number, required: true, default: Date.now })
  timestamp: number;
}

class RetryStatus extends CommonTimestamp {
  @Prop({ type: Boolean, required: true })
  isRetry: boolean;
}

class QueuedStatus extends CommonTimestamp {
  @Prop({ type: Boolean, required: true })
  isQueued: boolean;
}

class SentStatus extends CommonTimestamp {
  @Prop({ type: Boolean, required: true })
  isSent: boolean;
}

class DeliveredStatus extends CommonTimestamp {
  @Prop({ type: Boolean, required: true })
  isDelivered: boolean;
}

class ReadStatus extends CommonTimestamp {
  @Prop({ type: Boolean, required: true })
  isRead: boolean;
}

class CommonId {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;
}

class Sender extends CommonId {
  @Prop({ type: RetryStatus, required: false })
  retryStatus?: RetryStatus;

  @Prop({ type: QueuedStatus, required: true })
  queuedStatus: QueuedStatus;

  @Prop({ type: SentStatus, required: true })
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
  @Prop({ type: Types.ObjectId, required: true })
  chatId: Types.ObjectId;

  @Prop({ type: String, required: true })
  queueId: string;

  @Prop({ type: Boolean, required: true, default: true })
  isActive: boolean;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Sender, required: true })
  sender: Sender;

  @Prop({ type: [OtherMember], required: true })
  otherMembers: OtherMember[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = Message & Document & SchemaTimestampsConfig;
