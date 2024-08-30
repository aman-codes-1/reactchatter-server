import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'SentStatusObject' })
class SentStatus {
  @Field(() => Boolean)
  isSent: boolean;

  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'DeliveredStatusObject' })
class DeliveredStatus {
  @Field(() => Boolean)
  isDelivered: boolean;

  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'ReadStatusObject' })
class ReadStatus {
  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Float)
  timestamp: number;
}

@ObjectType({ description: 'SenderObject' })
export class Sender {
  @Field(() => String)
  _id: string;

  @Field(() => SentStatus)
  sentStatus: SentStatus;
}

@ObjectType({ description: 'OtherMemberObject' })
export class OtherMember {
  @Field(() => String)
  _id: string;

  @Field(() => DeliveredStatus, { nullable: true })
  deliveredStatus: DeliveredStatus;

  @Field(() => ReadStatus, { nullable: true })
  readStatus: ReadStatus;
}

@ObjectType({ description: 'MessageObject' })
export class Message {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  chatId: string;

  @Field(() => String)
  message: string;

  @Field(() => Sender)
  sender: Sender;

  @Field(() => [OtherMember])
  otherMembers: OtherMember[];
}

@ObjectType({ description: 'MessageDataObject' })
export class MessageData {
  @Field(() => String)
  chatId: string;

  @Field(() => [Message])
  message: Message[];
}
