import { ITransformer } from '../types/transformer.interface';

export const Base64Transformer: ITransformer = {
  onWrite: (text: string): string =>
    text ? Buffer.from(text, 'utf-8').toString('base64') : text,

  onRead: (text: string): string =>
    text ? Buffer.from(text, 'base64').toString('utf-8') : text,
};
