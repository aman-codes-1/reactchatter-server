import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

export class Member {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  hasSent: boolean;
}

@Schema({ timestamps: true })
export class Request {
  @Prop()
  members: Member[];

  @Prop()
  status: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
export type RequestDocument = Request & Document & SchemaTimestampsConfig;
