import { Transformers } from '../types/transformers.enum';
import { Base16Transformer } from './base16.transformer';
import { Base64Transformer } from './base64.transformer';
import { JSONTransformer } from './json.transformer';
import { KebabCaseTransformer } from './kebab-case.transformer';
import { PasswordHashTransformer } from './password-hash.transformer';
import { SnakeCaseTransformer } from './snake-case.transformer';

export const TransformerMap = {
  [Transformers.JSON]: JSONTransformer,
  [Transformers.BASE16]: Base16Transformer,
  [Transformers.BASE64]: Base64Transformer,
  [Transformers.KEBAB]: KebabCaseTransformer,
  [Transformers.SNAKE]: SnakeCaseTransformer,
  [Transformers.PASSWORD]: PasswordHashTransformer,
};
