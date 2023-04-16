import { ColumnHook } from '../types/column-hook.enum';
import { Base16Transformer } from './base16.transformer';
import { Base64Transformer } from './base64.transformer';
import { JSONTransformer } from './json.transformer';
import { KebabCaseTransformer } from './kebab-case.transformer';
import { PasswordHashTransformer } from './password-hash.transformer';
import { SnakeCaseTransformer } from './snake-case.transformer';

export const TransformerMap = {
  [ColumnHook.JSON]: JSONTransformer,
  [ColumnHook.BASE16]: Base16Transformer,
  [ColumnHook.BASE64]: Base64Transformer,
  [ColumnHook.KEBAB]: KebabCaseTransformer,
  [ColumnHook.SNAKE]: SnakeCaseTransformer,
  [ColumnHook.PASSWORD]: PasswordHashTransformer,
};
