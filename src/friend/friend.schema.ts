import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class Member {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  hasAdded: boolean;
}

@Schema({ timestamps: true })
export class Friend {
  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  members: Member[];
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
export type FriendDocument = Friend & Document & SchemaTimestampsConfig;
