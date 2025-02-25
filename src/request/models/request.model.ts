import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'RequestMemberObject' })
class RequestMember extends User {
  @Field(() => Boolean)
  hasSent: boolean;
}

@ObjectType({ description: 'RequestObject' })
export class Request {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  status: string;

  @Field(() => [RequestMember])
  members: RequestMember[];

  @Field(() => DateScalar)
  createdAt: Date;

  @Field(() => DateScalar)
  updatedAt: Date;
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
