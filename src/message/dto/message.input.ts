import { Field, Float, InputType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';

@InputType({ description: 'MessageInput' })
export class MessageInput {
  @Field(() => String)
  messageId: string;
}

@InputType({ description: 'MessagesInput' })
export class MessagesInput {
  @Field(() => String)
  chatId: string;
}

@InputType({ description: 'CreateMessageInput' })
export class CreateMessageInput {
  @Field(() => String)
  chatId: string;

  @Field(() => String)
  @MaxLength(4096)
  message: string;

  @Field(() => String)
  senderId: string;

  @Field(() => Float)
  timestamp: number;
}
