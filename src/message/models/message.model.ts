import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';

@InputType('SentStatusInput')
@ObjectType('SentStatusObject')
class SentStatus {
  @Field(() => Boolean)
  isSent: boolean;

  @Field(() => Float)
  timestamp: number;
}

@InputType('DeliveredStatusInput')
@ObjectType('DeliveredStatusObject')
class DeliveredStatus {
  @Field(() => Boolean)
  isDelivered: boolean;

  @Field(() => Float)
  timestamp: number;
}

@InputType('ReadStatusInput')
@ObjectType('ReadStatusObject')
class ReadStatus {
  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Float)
  timestamp: number;
}

@InputType('SenderInput')
@ObjectType('SenderObject')
export class Sender {
  @Field(() => String)
  _id: string;

  @Field(() => SentStatus)
  sentStatus: SentStatus;
}

@InputType('OtherMemberInput')
@ObjectType('OtherMemberObject')
export class OtherMember {
  @Field(() => String)
  _id: string;

  @Field(() => DeliveredStatus, { nullable: true })
  deliveredStatus: DeliveredStatus;

  @Field(() => ReadStatus, { nullable: true })
  readStatus: ReadStatus;
}

@ObjectType('MessageObject')
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

@ObjectType({ description: 'MessageDataExtendedObject' })
class MessageDataExtended {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  chatId: string;
}

@ObjectType({ description: 'MessageData' })
export class MessageData extends MessageDataExtended {
  @Field(() => Message)
  data: Message;
}

@ObjectType({ description: 'MessagesDataObject' })
export class MessagesData extends MessageDataExtended {
  @Field(() => [Message])
  data: Message[];
}
