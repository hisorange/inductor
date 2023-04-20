import { IMeta } from '../types/meta.interface';
import { AbstractAliasMeta } from './abstract-alias.meta';

export const RelationAliasMeta: IMeta = {
  id: 'inductor.relation-alias',
  interest: 'relation',

  ...AbstractAliasMeta,
};
