import { Field, InputType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';
import { OtherMember, Sender } from '../models/message.model';

@InputType({ description: 'MessageInput' })
export class MessageInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  chatId: string;

  @Field(() => String)
  messageId: string;
}

@InputType({ description: 'MessagesInput' })
export class MessagesInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  chatId: string;
}

@InputType({ description: 'CreateMessageInput' })
export class CreateMessageInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  chatId: string;

  @Field(() => String)
  @MaxLength(4096)
  message: string;

  @Field(() => Sender)
  sender: Sender;

  @Field(() => [OtherMember])
  otherMembers: OtherMember[];
}
