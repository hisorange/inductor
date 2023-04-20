import { IMeta } from '../types/meta.interface';
import { AbstractDescriptionMeta } from './abstract-description.meta';

export const ColumnDescriptionMeta: IMeta = {
  id: 'inductor.column-description',
  interest: 'column',

  ...AbstractDescriptionMeta,
};
