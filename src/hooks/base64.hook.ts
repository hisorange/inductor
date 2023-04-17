import { IColumnHook } from '../types/column-hook.interface';

export const Base64Hook: IColumnHook = {
  onWrite: (text: string): string =>
    text ? Buffer.from(text, 'utf-8').toString('base64') : text,

  onRead: (text: string): string =>
    text ? Buffer.from(text, 'base64').toString('utf-8') : text,
};
