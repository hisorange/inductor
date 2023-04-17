import kebabCase from 'lodash.kebabcase';
import { IColumnHook } from '../types/column-hook.interface';

export const KebabCaseHook: IColumnHook = {
  onWrite: (text: string): string => (text ? kebabCase(text) : text),
};
