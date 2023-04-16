import kebabCase from 'lodash.kebabcase';
import { ITransformer } from '../types/transformer.interface';

export const KebabCaseTransformer: ITransformer = {
  onWrite: (text: string): string => (text ? kebabCase(text) : text),
};
