import { IMeta } from '../types/meta.interface';
import { AbstractIdMeta } from './abstract-id.meta';

// TODO: implement database level reads
export const DatabaseIdMeta: IMeta = {
  id: 'inductor.database-id',
  interest: 'database',

  ...AbstractIdMeta,
};
