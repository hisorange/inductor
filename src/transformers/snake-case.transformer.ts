import snakeCase from 'lodash.snakecase';
import { ITransformer } from '../types/transformer.interface';

export const SnakeCaseTransformer: ITransformer = {
  onWrite: (text: string): string => (text ? snakeCase(text) : text),
};
