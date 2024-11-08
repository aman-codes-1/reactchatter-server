import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../auth/models/auth.model';

@ObjectType({ description: 'RequestMemberObject' })
class RequestMember extends User {
  @Field(() => Boolean, { nullable: true })
  hasSent?: boolean;
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
