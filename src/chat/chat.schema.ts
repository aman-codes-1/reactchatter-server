import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class DocumentResult<T> {
  _doc: T;
}

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

class Receiver extends CommonId {
  @Prop({ type: DeliveredStatus })
  deliveredStatus: DeliveredStatus;

  @Prop({ type: ReadStatus })
  readStatus: ReadStatus;
}

@Schema({ timestamps: true })
export class Chat extends DocumentResult<Chat> {
  @Prop()
  friendId: Types.ObjectId;

  @Prop()
  message: string;

  @Prop({ type: Sender })
  sender: Sender;

  @Prop({ type: Receiver })
  receiver: Receiver;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = Chat & Document;
