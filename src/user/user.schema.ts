import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  email_verified: boolean;

  @Prop()
  picture: string;

  @Prop()
  given_name: string;

  @Prop()
  family_name: string;

  @Prop()
  locale: string;

  @Prop()
  iat: number;

  @Prop()
  exp: number;

  @Prop()
  access_token: string;

  @Prop()
  refresh_token: string;

  @Prop()
  scope: string;

  @Prop()
  token_type: string;

  @Prop()
  id_token: string;

  @Prop()
  expiry_date: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document;
