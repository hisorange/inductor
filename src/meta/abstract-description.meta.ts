import { IMeta } from '../types/meta.interface';

export const AbstractDescriptionMeta: Omit<IMeta, 'id' | 'interest'> = {
  onWrite(comment, meta) {
    if (meta.description) comment.d = meta.description;
  },

  onRead(comment, meta) {
    if (comment.d) meta.description = comment.d;
  },
};
