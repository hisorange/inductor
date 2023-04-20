import { IMeta } from '../types/meta.interface';
import { AbstractAliasMeta } from './abstract-alias.meta';

export const TableAliasMeta: IMeta = {
  id: 'inductor.table-alias',
  interest: 'table',

  ...AbstractAliasMeta,
};
