import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class Member {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  hasAdded: boolean;

  @Prop({ isRequired: false })
  isAdmin: boolean;
}

@Schema({ timestamps: true })
export class Chat {
  @Prop()
  type: string;

  @Prop({ type: [Member] })
  members: Member[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
export type ChatDocument = Chat & Document & SchemaTimestampsConfig;
