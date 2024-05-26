import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class CommonTimestamp {
  @Prop()
  timestamp: number;
}

class SentStatus extends CommonTimestamp {
  @Prop()
  isSent: boolean;
}

class DeliveredStatus extends CommonTimestamp {
  @Prop()
  isDelivered: boolean;
}

class ReadStatus extends CommonTimestamp {
  @Prop()
  isRead: boolean;
}

class CommonId {
  @Prop()
  _id: string;
}

class Sender extends CommonId {
  @Prop({ type: SentStatus })
  sentStatus: SentStatus;
}

class OtherMember extends CommonId {
  @Prop({ type: DeliveredStatus })
  deliveredStatus: DeliveredStatus;

  @Prop({ type: ReadStatus })
  readStatus: ReadStatus;
}

@Schema({ timestamps: true })
export class Message {
  @Prop()
  chatId: Types.ObjectId;

  @Prop()
  message: string;

  @Prop({ type: Sender })
  sender: Sender;

  @Prop({ type: [OtherMember] })
  otherMembers: OtherMember[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type MessageDocument = Message & Document & SchemaTimestampsConfig;
