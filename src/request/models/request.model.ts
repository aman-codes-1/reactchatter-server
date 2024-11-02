import { Field, ObjectType } from '@nestjs/graphql';
import { Auth } from '../../auth/models/auth.model';

@ObjectType({ description: 'RequestMemberObject' })
class RequestMember {
  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  hasSent: boolean;

  @Field(() => Auth, { nullable: true })
  memberDetails?: Auth;
}

@ObjectType({ description: 'RequestObject' })
export class Request {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  status: string;

  @Field(() => [RequestMember])
  members: RequestMember[];

  @Field(() => Auth, { nullable: true })
  details?: Auth;
}

@ObjectType({ description: 'RequestsDataObject' })
export class RequestsData {
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
