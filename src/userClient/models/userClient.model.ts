import { Field, ObjectType } from '@nestjs/graphql';
import { DateScalar } from '../../common/scalars/date.scalar';

@ObjectType({ description: 'LastActiveObject' })
class LastActive {
  @Field(() => DateScalar, { nullable: true })
  lastActive?: Date;
}

@ObjectType({ description: 'ClientObject' })
export class Client extends LastActive {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  sessionID: string;
}

@ObjectType({ description: 'UserClientObject' })
export class UserClient extends LastActive {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  userId: string;

  @Field(() => [Client], { nullable: true })
  clients?: Client[];

  @Field(() => Boolean, { nullable: true })
  hasNotifications?: boolean;
}

@ObjectType({ description: 'OnlineStatusObject' })
export class OnlineStatus {
  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => DateScalar)
  lastSeen: Date;
}

@ObjectType({ description: 'UserOnlineStatusObject' })
export class UserOnlineStatus {
  @Field(() => String)
  userId: string;

  @Field(() => OnlineStatus)
  onlineStatus: OnlineStatus;
}

@ObjectType({ description: 'UserClientDataObject' })
export class UserClientData {
  @Field(() => UserClient)
  userClient: UserClient;
}
