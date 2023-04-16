import { ITransformer } from '../types/transformer.interface';

export const Base16Transformer: ITransformer = {
  onWrite: (text: string): string =>
    text ? Buffer.from(text).toString('hex') : text,

  onRead: (text: string): string =>
    text ? Buffer.from(text, 'hex').toString('utf8') : text,
};
