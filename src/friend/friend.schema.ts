import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class Member {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  hasAdded: boolean;
}

@Schema({ timestamps: true })
export class Friend {
  @Prop()
  members: Member[];

  @Prop()
  isFriend: boolean;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
export type FriendDocument = Friend & Document;
