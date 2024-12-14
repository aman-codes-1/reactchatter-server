import { Field, Float, ObjectType } from '@nestjs/graphql';
import { DateScalar } from '../../common/scalars/date.scalar';
import { AnyScalar } from '../../common/scalars/any.scalar';

@ObjectType({ description: 'AuthTokensObject' })
export class AuthTokens {
  @Field(() => String)
  access_token: string;

  @Field(() => String)
  refresh_token: string;

  @Field(() => String)
  scope: string;

  @Field(() => String)
  token_type: string;

  @Field(() => String)
  id_token: string;

  @Field(() => Float)
  expires_in: number;

  @Field(() => Float)
  expiry_date: number;
}

@ObjectType({ description: 'ActiveConnectionObject' })
export class ActiveConnection {
  @Field(() => String)
  clientId: string;

  @Field(() => Boolean)
  isClientActive: boolean;

  @Field(() => DateScalar)
  lastActive: Date;
}

@ObjectType({ description: 'ActiveConnectionsObject' })
export class ActiveConnections {
  @Field(() => [ActiveConnection])
  activeConnections: ActiveConnection[];
}

@ObjectType({ description: 'UserSessionObject' })
export class UserSession extends ActiveConnections {
  @Field(() => String)
  _id: string;

  @Field(() => DateScalar)
  expires: Date;

  @Field(() => AnyScalar)
  session: Record<string, any>;
}

@ObjectType({ description: 'SessionActiveConnectionsDataObject' })
export class SessionActiveConnectionsData extends ActiveConnections {
  @Field(() => String)
  _id: string;
}

@ObjectType({ description: 'OnlineStatusObject' })
export class OnlineStatus {
  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => Float)
  lastSeen: number;
}

@ObjectType({ description: 'UserActiveConnectionsDataObject' })
export class UserActiveConnectionsData extends ActiveConnections {
  @Field(() => String)
  userId: string;

  @Field(() => OnlineStatus)
  onlineStatus: OnlineStatus;
}
