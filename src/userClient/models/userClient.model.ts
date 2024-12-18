import { Field, ObjectType } from '@nestjs/graphql';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'ClientObject' })
export class Client {
  @Field(() => String)
  clientId: string;

  @Field(() => Boolean)
  isClientActive: boolean;

  @Field(() => DateScalar)
  lastActive: Date;
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

@ObjectType({ description: 'SessionClientsDataObject' })
export class SessionClientsData extends Clients {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  sessionID: string;
}

@ObjectType({ description: 'OnlineStatusObject' })
export class OnlineStatus {
  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => DateScalar)
  lastSeen: Date;
}

@ObjectType({ description: 'UserClientsDataObject' })
export class UserClientsData extends Clients {
  @Field(() => String)
  userId: string;

  @Field(() => OnlineStatus)
  onlineStatus: OnlineStatus;
}
