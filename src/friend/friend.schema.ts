import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class DocumentResult<T> {
  _doc: T;
}

@Schema({ timestamps: true })
export class Friend extends DocumentResult<Friend> {
  @Prop()
  userId: Types.ObjectId;

  @Prop()
  addedByUserId: Types.ObjectId;

  @Prop()
  isFriend: boolean;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
export type FriendDocument = Friend & Document;
