import { ColumnCapability } from '../types/column.capability';
import { IMeta } from '../types/meta.interface';

export const ColumnCapMeta: IMeta = {
  id: 'inductor.column-cap',
  interest: 'column',

  onWrite(comment, meta) {
    if (Object.keys(meta).includes('capabilities')) {
      comment.c = 0;

      for (const cap of meta.capabilities.sort()) {
        comment.c = comment.c! | cap;
      }
    }
  },

  onRead(comment, meta) {
    if (typeof comment?.c === 'number') {
      meta.capabilities = [];

      [
        ColumnCapability.CREATED_AT,
        ColumnCapability.UPDATED_AT,
        ColumnCapability.DELETED_AT,
      ].forEach(cap => comment.c! & cap && meta.capabilities!.push(cap));

      meta.capabilities.sort(
        (a: ColumnCapability, b: ColumnCapability) => a - b,
      );
    }
  },
};
