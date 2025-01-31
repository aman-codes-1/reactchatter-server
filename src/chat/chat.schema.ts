import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class ChatMember {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  hasAdded: boolean;

  @Prop({ type: Boolean, required: false })
  isAdmin?: boolean;
}

class FriendMember {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;
}

type ChatType = 'private' | 'group';

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: Boolean, required: true, default: true })
  isActive: boolean;

  @Prop({
    type: String,
    required: true,
    default: 'private',
    enum: ['private', 'group'],
  })
  type: ChatType;

  @Prop({ type: [ChatMember], required: true })
  members: ChatMember[];

  @Prop({ type: [FriendMember], required: true })
  friends: FriendMember[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = Chat & Document & SchemaTimestampsConfig;
