import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';

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
class DeliveredStatus extends CommonTimestamp {
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
export class Sender extends CommonId {
  @Field(() => RetryStatus, { nullable: true })
  retryStatus?: RetryStatus;

  @Field(() => QueuedStatus)
  queuedStatus: QueuedStatus;

  @Field(() => SentStatus)
  sentStatus: SentStatus;
}

@ObjectType({ description: 'OtherMemberObject' })
export class OtherMember extends CommonId {
  @Field(() => DeliveredStatus, { nullable: true })
  deliveredStatus?: DeliveredStatus;

  @Field(() => ReadStatus, { nullable: true })
  readStatus?: ReadStatus;
}

@ObjectType({ description: 'MessageObject' })
export class Message extends CommonId {
  @Field(() => String)
  chatId: Types.ObjectId;

  @Field(() => String)
  queueId: string;

  @Field(() => String)
  message: string;

  @Field(() => Sender)
  sender: Sender;

  @Field(() => [OtherMember])
  otherMembers: OtherMember[];

  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'PageInfoObject' })
export class PageInfo {
  @Field(() => String)
  endCursor: string;

  @Field(() => Boolean)
  hasNextPage: boolean;
}

@ObjectType({ description: 'MessagesDataObject' })
export class MessagesData {
  @Field(() => [Message])
  edges: Message[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@ObjectType({ description: 'MessageDataObject' })
export class MessageData {
  @Field(() => String)
  chatId: string;

  @Field(() => Message)
  message: Message;
}

@ObjectType({ description: 'GroupObject' })
export class Group {
  @Field(() => String)
  side: string;

  @Field(() => [Message])
  data: Message[];
}

@ObjectType({ description: 'MessageGroupObject' })
export class MessageGroup {
  @Field(() => String)
  dateLabel: string;

  @Field(() => [Group])
  groups: Group[];
}

@ObjectType({ description: 'MessageGroupsDataObject' })
export class MessageGroupsData {
  @Field(() => [MessageGroup])
  edges: MessageGroup[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => PageInfo)
  queuedPageInfo: PageInfo;

  @Field(() => Int)
  scrollPosition: number;
}
