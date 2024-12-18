import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig } from 'mongoose';

@Schema({ timestamps: true })
export class UserSession {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  expires: Date;

  @Prop({ type: Object, required: true })
  session: Record<string, any>;

  @Prop({ type: Date, required: false, default: () => new Date() })
  lastModified: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
export type UserSessionDocument = UserSession &
  Document &
  SchemaTimestampsConfig;
