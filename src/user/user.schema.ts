import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  picture: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Boolean, required: true })
  email_verified: boolean;

  @Prop({ type: String, required: true })
  given_name: string;

  @Prop({ type: String, required: true })
  family_name: string;

  @Prop({ type: String, required: true, default: 'default' })
  provider: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document & SchemaTimestampsConfig;
