import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig } from 'mongoose';

class Tokens {
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
  expires_in: number;

  @Prop()
  expiry_date: number;
}

class GoogleAuth {
  @Prop()
  iat: number;

  @Prop()
  exp: number;

  @Prop()
  iss: string;

  @Prop()
  azp: string;

  @Prop()
  aud: string;

  @Prop()
  sub: string;

  @Prop()
  at_hash: string;

  @Prop()
  hd: string;

  @Prop()
  locale: string;

  @Prop()
  nonce: string;

  @Prop()
  profile: string;

  @Prop()
  tokens: Tokens;
}

@Schema({ timestamps: true })
export class User extends GoogleAuth {
  @Prop()
  name: string;

  @Prop()
  picture: string;

  @Prop()
  email: string;

  @Prop()
  email_verified: boolean;

  @Prop()
  given_name: string;

  @Prop()
  family_name: string;

  @Prop()
  provider: string;

  @Prop({ required: false })
  google_auth?: GoogleAuth;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document & SchemaTimestampsConfig;
