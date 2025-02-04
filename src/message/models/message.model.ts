import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { User } from '../../user/models/user.model';

@ObjectType({ description: 'CommonTimestampObject' })
class CommonTimestamp {
  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'RetryStatusObject' })
class RetryStatus extends CommonTimestamp {
  @Field(() => Boolean)
  isRetry: boolean;
}

@ObjectType({ description: 'QueuedStatusObject' })
class QueuedStatus extends CommonTimestamp {
  @Field(() => Boolean)
  isQueued: boolean;
}

@ObjectType({ description: 'SentStatusObject' })
class SentStatus extends CommonTimestamp {
  @Field(() => Boolean)
  isSent: boolean;
}

@ObjectType({ description: 'DeliveredStatusObject' })
export class DeliveredStatus extends CommonTimestamp {
  @Field(() => Boolean)
  isDelivered: boolean;
}

@ObjectType({ description: 'ReadStatusObject' })
class ReadStatus extends CommonTimestamp {
  @Field(() => Boolean)
  isRead: boolean;
}

@ObjectType({ description: 'CommonIdObject' })
class CommonId {
  @Field(() => String)
  _id: string;
}

@ObjectType({ description: 'SenderObject' })
export class Sender extends User {
  @Field(() => RetryStatus, { nullable: true })
  retryStatus?: RetryStatus;

  @Field(() => QueuedStatus)
  queuedStatus: QueuedStatus;

  @Field(() => SentStatus)
  sentStatus: SentStatus;
}

@ObjectType({ description: 'ReceiverObject' })
export class Receiver extends User {
  @Field(() => DeliveredStatus, { nullable: true })
  deliveredStatus?: DeliveredStatus;

  @Field(() => ReadStatus, { nullable: true })
  readStatus?: ReadStatus;
}

@ObjectType({ description: 'MessageObject' })
export class Message extends CommonId {
  @Field(() => String)
  chatId: string;

  @Field(() => String)
  queueId: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => String)
  message: string;

  @Field(() => Sender)
  sender: Sender;

  @Field(() => [Receiver])
  receivers: Receiver[];

  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'PageInfoObject' })
export class PageInfo {
  @Field(() => String)
  endCursor: string;

  @Field(() => Boolean)
  hasPreviousPage: boolean;

  @Field(() => Boolean)
  hasNextPage: boolean;
}

@ObjectType({ description: 'MessagesDataObject' })
export class MessagesData {
  @Field(() => [Message])
  edges: Message[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  scrollPosition: number;

  @Field(() => Boolean, { nullable: true })
  isFetched?: boolean;
}

@ObjectType({ description: 'MessageDataObject' })
export class MessageData {
  @Field(() => Message)
  message: Message;
}
