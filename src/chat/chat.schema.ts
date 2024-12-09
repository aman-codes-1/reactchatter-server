import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class Member {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  hasAdded: boolean;

  @Prop({ type: Boolean, required: false })
  isAdmin?: boolean;
}

type ChatType = 'private' | 'group';

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: String, required: false })
  queueId?: string;

  @Prop({ type: Boolean, required: true, default: true })
  isActive: boolean;

  @Prop({
    type: String,
    required: true,
    default: 'private',
    enum: ['private', 'group'],
  })
  type: ChatType;

  @Prop({ type: [Member], required: true })
  members: Member[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = Chat & Document & SchemaTimestampsConfig;
