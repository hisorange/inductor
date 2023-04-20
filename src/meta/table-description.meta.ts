import { IMeta } from '../types/meta.interface';
import { AbstractDescriptionMeta } from './abstract-description.meta';

export const TableDescriptionMeta: IMeta = {
  id: 'inductor.table-description',
  interest: 'table',

  ...AbstractDescriptionMeta,
};
