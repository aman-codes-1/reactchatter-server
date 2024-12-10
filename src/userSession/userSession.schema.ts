import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTimestampsConfig } from 'mongoose';

class LastActive {
  @Prop({ type: Number, required: true, default: Date.now })
  lastActive: number;
}

export class ActiveConnection extends LastActive {
  @Prop({ type: String, required: true })
  clientId: string;

  @Prop({ type: Boolean, required: true })
  isClientActive: boolean;
}

@Schema({ timestamps: true })
export class UserSession extends LastActive {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  expires: Date;

  @Prop({ type: Object, required: true })
  session: Record<string, any>;

  @Prop({ type: [ActiveConnection], required: false })
  activeConnections?: ActiveConnection[];
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
export type UserSessionDocument = UserSession &
  Document &
  SchemaTimestampsConfig;
