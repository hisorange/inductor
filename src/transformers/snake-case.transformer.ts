import snakeCase from 'lodash.snakecase';
import { IColumnHook } from '../types/column-hook.interface';

export const SnakeCaseTransformer: IColumnHook = {
  onWrite: (text: string): string => (text ? snakeCase(text) : text),
};
