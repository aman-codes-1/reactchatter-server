import { Field, InputType } from '@nestjs/graphql';
import { Member } from '../models/chat.model';

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
  friendId: string;

  @Field(() => String)
  type: string;

  @Field(() => [Member])
  members: Member[];
}
