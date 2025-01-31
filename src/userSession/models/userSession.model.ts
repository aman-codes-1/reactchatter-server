import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { DateScalar } from '../../common/scalars/date.scalar';
import { AnyScalar } from '../../common/scalars/any.scalar';
import { Clients } from '../../userClient/models/userClient.model';

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

  @Field(() => Int)
  expires_in: number;

  @Field(() => Float)
  expiry_date: number;
}

@ObjectType({ description: 'UserSessionObject' })
export class UserSession extends Clients {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String, { nullable: true })
  provider?: string;

  @Field(() => AuthTokens, { nullable: true })
  authTokens?: AuthTokens;

  @Field(() => AnyScalar, { nullable: true })
  deviceDetails?: Record<string, any>;

  @Field(() => DateScalar, { nullable: true })
  expires?: Date;

  @Field(() => DateScalar, { nullable: true })
  lastModified?: Date;

  @Field(() => DateScalar, { nullable: true })
  lastActive?: Date;
}

@ObjectType({ description: 'UserSessionDataObject' })
export class UserSessionData {
  @Field(() => UserSession)
  session: UserSession;
}
