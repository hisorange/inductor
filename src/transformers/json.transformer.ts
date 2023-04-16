import { ITransformer } from '../types/transformer.interface';

export const JSONTransformer: ITransformer = {
  onWrite: JSON.stringify,
  onRead: (text: string): any => (text ? JSON.parse(text) : text),
};
