import { ColumnHook } from '../types/column-hook.enum';
import { IMetaExtension } from '../types/meta-coder.interface';

export const ColumnHookMeta: IMetaExtension = {
  id: 'inductor.column-hook',
  interest: 'column',

  onWrite(comment, meta) {
    if (Object.keys(meta).includes('transformers')) {
      comment.t = 0;

      for (const transformer of meta.transformers.sort()) {
        comment.t = comment.t! | transformer;
      }
    }
  },

  onRead(comment, meta) {
    if (typeof comment?.t === 'number') {
      meta.transformers = [];

      [
        ColumnHook.JSON,
        ColumnHook.BASE16,
        ColumnHook.BASE64,
        ColumnHook.KEBAB,
        ColumnHook.SNAKE,
        ColumnHook.PASSWORD,
      ].forEach(cap => comment.t! & cap && meta.transformers!.push(cap));

      meta.transformers.sort((a: ColumnHook, b: ColumnHook) => a - b);
    }
  },
};
