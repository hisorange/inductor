import { IColumnHook } from '../types/column-hook.interface';

export const Base16Transformer: IColumnHook = {
  onWrite: (text: string): string =>
    text ? Buffer.from(text).toString('hex') : text,

  onRead: (text: string): string =>
    text ? Buffer.from(text, 'hex').toString('utf8') : text,
};
