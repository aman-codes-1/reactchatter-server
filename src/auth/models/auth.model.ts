import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'TokensObject' })
class Tokens {
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

@ObjectType({ description: 'GoogleAuthObject' })
class GoogleAuth {
  @Field(() => Float)
  iat: number;

  @Field(() => Float)
  exp: number;

  @Field(() => String)
  iss: string;

  @Field(() => String)
  azp: string;

  @Field(() => String)
  aud: string;

  @Field(() => String)
  sub: string;

  @Field(() => String)
  at_hash: string;

  @Field(() => String)
  hd: string;

  @Field(() => String)
  locale: string;

  @Field(() => String)
  nonce: string;

  @Field(() => String)
  profile: string;

  @Field(() => Tokens)
  tokens: Tokens;
}

@ObjectType({ description: 'AuthObject' })
export class Auth {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  picture: string;

  @Field(() => String)
  email: string;

  @Field(() => Boolean)
  email_verified: boolean;

  @Field(() => String)
  given_name: string;

  @Field(() => String)
  family_name: string;

  @Field(() => String, { nullable: true })
  provider?: string;

  @Field(() => GoogleAuth, { nullable: true })
  google_auth?: GoogleAuth;
}
