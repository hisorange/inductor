import { IColumnHook } from '../types/column-hook.interface';

export const JSONTransformer: IColumnHook = {
  onWrite: JSON.stringify,
  onRead: (text: string): any => (text ? JSON.parse(text) : text),
};
