import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';

@InputType('SentStatusInput')
@ObjectType('SentStatusObject')
class SentStatus {
  @Field((type) => Boolean)
  isSent: boolean;

  @Field((type) => Float)
  timestamp: number;
}

@InputType('DeliveredStatusInput')
@ObjectType('DeliveredStatusObject')
class DeliveredStatus {
  @Field((type) => Boolean)
  isDelivered: boolean;

  @Field((type) => Float)
  timestamp: number;
}

@InputType('ReadStatusInput')
@ObjectType('ReadStatusObject')
class ReadStatus {
  @Field((type) => Boolean)
  isRead: boolean;

  @Field((type) => Float)
  timestamp: number;
}

@InputType('SenderInput')
@ObjectType('SenderObject')
class Sender {
  @Field((type) => String)
  _id: string;

  @Field((type) => SentStatus)
  sentStatus: SentStatus;
}

@InputType('ReceiverInput')
@ObjectType('ReceiverObject')
class Receiver {
  @Field((type) => String)
  _id: string;

  @Field((type) => DeliveredStatus, { nullable: true })
  deliveredStatus: DeliveredStatus;

  @Field((type) => ReadStatus, { nullable: true })
  readStatus: ReadStatus;
}

@InputType('ChatInput')
@ObjectType('ChatObject')
export class Chat {
  @Field({ nullable: true })
  _id: string;

  @Field((type) => String)
  friendId: string;

  @Field((type) => String)
  @MaxLength(4096)
  message: string;

  @Field((type) => Sender)
  sender: Sender;

  @Field((type) => Receiver)
  receiver: Receiver;
}

@ObjectType({ description: 'ChatDataObject' })
export class ChatData {
  @Field((type) => String)
  friendId: string;

  @Field((type) => Chat)
  data: Chat;
}

@ObjectType({ description: 'ChatsDataObject' })
export class ChatsData {
  @Field((type) => String)
  friendId: string;

  @Field((type) => [Chat])
  data: Chat[];
}
