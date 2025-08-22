import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig, Types } from 'mongoose';

class LastActive {
  @Prop({ type: Date, required: true, default: () => new Date() })
  lastActive: Date;
}

export class Client extends LastActive {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true })
  sessionID: string;
}

@Schema({ timestamps: true })
export class UserClient extends LastActive {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Client], required: false })
  clients?: Client[];

  @Prop({ type: Boolean, required: false, default: false })
  hasNotifications?: boolean;
}

export const UserClientSchema = SchemaFactory.createForClass(UserClient);
export type UserClientDocument = UserClient & Document & SchemaTimestampsConfig;
