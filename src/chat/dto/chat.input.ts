import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'ChatInput' })
export class ChatInput {
  @Field(() => String)
  chatId: string;
}

@InputType({ description: 'ChatsInput' })
export class ChatsInput {
  @Field(() => String)
  userId: string;
}

@InputType({ description: 'CreateChatInput' })
export class CreateChatInput extends ChatsInput {
  @Field(() => String)
  queueId: string;

  @Field(() => String)
  type: string;

  @Field(() => [String])
  friendIds: string[];

  @Field(() => [String])
  friendUserIds: string[];
}
