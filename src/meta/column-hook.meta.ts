import { ColumnHook } from '../types/column-hook.enum';
import { IMeta } from '../types/meta.interface';

export const ColumnHookMeta: IMeta = {
  id: 'inductor.column-hook',
  interest: 'column',

  onWrite(comment, meta) {
    if (Object.keys(meta).includes('hooks')) {
      comment.h = 0;

      for (const hook of meta.hooks.sort()) {
        comment.h = comment.h! | hook;
      }
    }
  },

  onRead(comment, meta) {
    if (typeof comment?.h === 'number') {
      meta.hooks = [];

      [
        ColumnHook.JSON,
        ColumnHook.BASE16,
        ColumnHook.BASE64,
        ColumnHook.KEBAB,
        ColumnHook.SNAKE,
        ColumnHook.PASSWORD,
      ].forEach(hook => comment.h! & hook && meta.hooks!.push(hook));

      meta.hooks.sort((a: ColumnHook, b: ColumnHook) => a - b);
    }
  },
};
