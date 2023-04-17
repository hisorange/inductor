import { IColumnHook } from '../types/column-hook.interface';

export const JSONColumnHook: IColumnHook = {
  onWrite: JSON.stringify,
  onRead: (text: string): any =>
    typeof text === 'string' ? JSON.parse(text) : text,
};
