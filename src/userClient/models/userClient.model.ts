import { Field, ObjectType } from '@nestjs/graphql';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'ClientObject' })
export class Client {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  sessionID: string;

  @Field(() => Boolean, { nullable: true })
  isClientActive?: boolean;

  @Field(() => DateScalar, { nullable: true })
  lastActive?: Date;
}

@ObjectType({ description: 'ClientsObject' })
export class Clients {
  @Field(() => [Client], { nullable: true })
  clients?: Client[];
}

@ObjectType({ description: 'UserClientObject' })
export class UserClient extends Clients {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  userId: string;
}

@ObjectType({ description: 'OnlineStatusObject' })
export class OnlineStatus {
  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => DateScalar)
  lastSeen: Date;
}

@ObjectType({ description: 'ClientsDataObject' })
export class ClientData extends Clients {
  @Field(() => String)
  userId: string;

  @Field(() => OnlineStatus)
  onlineStatus: OnlineStatus;
}
