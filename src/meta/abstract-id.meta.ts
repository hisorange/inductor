import { IMeta } from '../types/meta.interface';

export const AbstractIdMeta: Omit<IMeta, 'id' | 'interest'> = {
  onWrite(comment, meta) {
    if (meta.id) comment.id = meta.id;
  },

  onRead(comment, meta) {
    if (comment.id) meta.id = comment.id;
  },
};
