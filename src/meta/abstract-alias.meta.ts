import { IMeta } from '../types/meta.interface';

export const AbstractAliasMeta: Omit<IMeta, 'id' | 'interest'> = {
  onWrite(comment, meta) {
    if (meta.alias) comment.a = meta.alias;
  },

  onRead(comment, meta) {
    if (comment.a) meta.alias = comment.a;
  },
};
