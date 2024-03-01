import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: 'chatsInput' })
export class ChatsInput {
  @Field((type) => String)
  friendId: string;
}
