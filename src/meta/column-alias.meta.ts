import { IMetaExtension } from '../types/meta-coder.interface';

export const ColumnAliasMeta: IMetaExtension = {
  id: 'inductor.column-alias',
  interest: 'column',

  onWrite(comment, meta) {
    if (meta.alias) comment.a = meta.alias;
  },

  onRead(comment, meta) {
    if (comment.a) meta.alias = comment.a;
  },
};
