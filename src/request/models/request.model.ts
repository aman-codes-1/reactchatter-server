import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('UserDetailsObject')
export class UserDetails {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => Boolean)
  email_verified: boolean;

  @Field(() => String)
  picture: string;

  @Field(() => String)
  given_name: string;

  @Field(() => String)
  family_name: string;
}

@ObjectType({ description: 'RequestObject' })
export class Request {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  sentByUserId: string;

  @Field(() => String)
  sentToUserId: string;

  @Field(() => String)
  status: string;

  @Field(() => UserDetails)
  userDetails: UserDetails;
}

@ObjectType({ description: 'RequestDataObject' })
export class RequestData {
  @Field(() => Request)
  request: Request;
}
