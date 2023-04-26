import { IMeta } from '../types/meta.interface';
import { AbstractIdMeta } from './abstract-id.meta';

export const TableIdMeta: IMeta = {
  id: 'inductor.table-id',
  interest: 'table',

  ...AbstractIdMeta,
};
