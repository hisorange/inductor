import { IMeta } from '../types/meta.interface';

export const TableAliasMeta: IMeta = {
  id: 'inductor.table-alias',
  interest: 'table',

  onWrite(comment, meta) {
    if (meta.alias) comment.a = meta.alias;
  },

  onRead(comment, meta) {
    if (comment.a) meta.alias = comment.a;
  },
};
