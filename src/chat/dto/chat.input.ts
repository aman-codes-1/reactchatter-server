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
export class CreateChatInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  friendId: string;

  @Field(() => String, { nullable: true })
  queueId: string;

  @Field(() => String)
  type: string;

  @Field(() => String)
  friendUserId: string;
}
