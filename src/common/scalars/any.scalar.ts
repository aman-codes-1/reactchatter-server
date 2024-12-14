import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind } from 'graphql';

@Scalar('Any')
export class AnyScalar implements CustomScalar<string, any> {
  description = 'Any scalar type';

  parseValue(value: any) {
    return value;
  }

  serialize(value: any) {
    return value;
  }

  parseLiteral(ast: any) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.INT:
      case Kind.FLOAT:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.OBJECT:
      case Kind.LIST:
        return ast.value;
      default:
        return null;
    }
  }
}
