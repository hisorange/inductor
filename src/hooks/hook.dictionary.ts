import { ColumnHook } from '../types/column-hook.enum';
import { Base16Hook } from './base16.hook';
import { Base64Hook } from './base64.hook';
import { JSONColumnHook } from './json.hook';
import { KebabCaseHook } from './kebab-case.hook';
import { PasswordHook } from './password.hook';
import { SnakeCaseHook } from './snake-case.hook';

export const HookDictionary = {
  [ColumnHook.JSON]: JSONColumnHook,
  [ColumnHook.BASE16]: Base16Hook,
  [ColumnHook.BASE64]: Base64Hook,
  [ColumnHook.KEBAB]: KebabCaseHook,
  [ColumnHook.SNAKE]: SnakeCaseHook,
  [ColumnHook.PASSWORD]: PasswordHook,
};
