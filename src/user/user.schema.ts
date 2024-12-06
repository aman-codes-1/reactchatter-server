import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig } from 'mongoose';

class AuthTokens {
  @Prop()
  access_token: string;

  @Prop()
  refresh_token: string;

  @Prop()
  id_token: string;

  @Prop()
  scope: string;

  @Prop()
  token_type: string;

  @Prop()
  expires_in: number;

  @Prop()
  expiry_date: number;
}

// class Connection {
//   @Prop()
//   clientId: string;

//   @Prop()
//   lastActive: number;
// }

export class OnlineStatus {
  // @Prop({ default: false })
  // isOnline: boolean;

  @Prop()
  timestamp: number;

  // @Prop()
  // connections: Connection[];
}

class DeviceDetails {}

@Schema({ timestamps: true })
export class User {
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

  @Prop({ default: 'default' })
  provider: string;

  @Prop({ required: false })
  onlineStatus?: OnlineStatus;

  @Prop()
  authTokens: AuthTokens;

  @Prop({ required: false })
  deviceDetails?: DeviceDetails;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = User & Document & SchemaTimestampsConfig;
