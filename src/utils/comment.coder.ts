import { ColumnCapability } from '../types/column.capability';
import { IColumn } from '../types/column.interface';

type Comments = {
  c?: number; // capabilities
  a?: string; // alias
};

export const encodeComments = (column: IColumn): string => {
  const r: Comments = {};

  if (column.capabilities.length) {
    r.c = 0;

    for (const cap of column.capabilities.sort()) {
      r.c = r.c! | cap;
    }
  }

  if (column.alias) {
    r.a = column.alias;
  }

  return Object.keys(r).length ? JSON.stringify(r) : '';
};

export const decodeComments = (column: IColumn, comment: string): IColumn => {
  // Skip on empty comment
  if (!comment || !comment.length || comment === '{}') {
    return column;
  }

  try {
    let r: Comments = JSON.parse(comment) as Comments;

    if (r.c && typeof r.c === 'number') {
      [
        ColumnCapability.CREATED_AT,
        ColumnCapability.UPDATED_AT,
        ColumnCapability.DELETED_AT,
        ColumnCapability.VERSION,
      ].forEach(cap => r.c! & cap && column.capabilities.push(cap));

      column.capabilities.sort((a, b) => a - b);
    }

    if (r.a && typeof r.a === 'string') {
      column.alias = r.a;
    }

    return column;
  } catch (e) {}

  return column;
};
