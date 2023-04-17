import { IMeta } from '../types/meta.interface';

export const RelationAliasMeta: IMeta = {
  id: 'inductor.relation-alias',
  interest: 'relation',

  onWrite(comment, meta) {
    if (meta.alias) comment.a = meta.alias;
  },

  onRead(comment, meta) {
    if (comment.a) meta.alias = comment.a;
  },
};
