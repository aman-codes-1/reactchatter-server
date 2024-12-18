import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
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

  @Field(() => Int)
  expires_in: number;

  @Field(() => Float)
  expiry_date: number;
}

@ObjectType({ description: 'UserSessionObject' })
export class UserSession {
  @Field(() => String)
  _id: string;

  @Field(() => DateScalar)
  expires: Date;

  @Field(() => AnyScalar)
  session: Record<string, any>;

  @Field(() => DateScalar, { nullable: true })
  lastModified?: Date;
}
