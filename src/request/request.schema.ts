import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

export class Member {
  @Prop({ type: Types.ObjectId, required: true })
  _id: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  hasSent: boolean;
}

@Schema({ timestamps: true })
export class Request {
  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: [Member], required: true })
  members: Member[];
}

export const RequestSchema = SchemaFactory.createForClass(Request);
export type RequestDocument = Request & Document & SchemaTimestampsConfig;
