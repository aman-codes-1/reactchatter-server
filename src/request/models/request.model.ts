import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'RequestMemberDetailsObject' })
class RequestMemberDetails {
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

@ObjectType({ description: 'RequestMemberObject' })
class RequestMember {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasSent: boolean;

  @Field(() => RequestMemberDetails, { nullable: true })
  memberDetails: RequestMemberDetails;
}

@ObjectType({ description: 'RequestObject' })
export class Request {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  status: string;

  @Field(() => [RequestMember])
  members: RequestMember[];
}

@ObjectType({ description: 'PaginatedRequestObject' })
export class PaginatedRequest {
  @Field(() => [Request])
  data: Request[];

  @Field(() => Number)
  totalCount: number;
}

@ObjectType({ description: 'RequestDataObject' })
export class RequestData {
  @Field(() => Request)
  request: Request;
}
