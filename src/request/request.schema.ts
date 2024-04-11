import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Request {
  @Prop()
  sentByUserId: Types.ObjectId;

  @Prop()
  sentToUserId: Types.ObjectId;

  @Prop()
  status: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
export type RequestDocument = Request & Document;
