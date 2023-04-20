import { IMeta } from '../types/meta.interface';
import { AbstractAliasMeta } from './abstract-alias.meta';

export const ColumnAliasMeta: IMeta = {
  id: 'inductor.column-alias',
  interest: 'column',

  ...AbstractAliasMeta,
};
