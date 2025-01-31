import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class FriendMember {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  hasAdded: boolean;
}

@Schema({ timestamps: true })
export class Friend {
  @Prop({ type: Boolean, required: true, default: true })
  isActive: boolean;

  @Prop({ type: [FriendMember], required: true })
  members: FriendMember[];
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
export type FriendDocument = Friend & Document & SchemaTimestampsConfig;
