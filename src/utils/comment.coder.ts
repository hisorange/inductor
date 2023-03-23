import { ColumnCapability } from '../types/column.capability';
import { IColumn } from '../types/column.interface';

type Comments = {
  c?: number; // capabilities
};

export const encodeComments = (column: IColumn): string => {
  if (column.capabilities.length) {
    const r: Comments = {};

    r.c = 0;

    for (const cap of column.capabilities.sort()) {
      r.c = r.c! | cap;
    }

    return JSON.stringify(r);
  }

  return '';
};

export const decodeComments = (column: IColumn, comment: string): IColumn => {
  let r: Comments;

  try {
    r = JSON.parse(comment) as Comments;

    if (typeof r.c === 'number') {
      [
        ColumnCapability.CREATED_AT,
        ColumnCapability.UPDATED_AT,
        ColumnCapability.DELETED_AT,
        ColumnCapability.VERSION,
      ].forEach(cap => r.c! & cap && column.capabilities.push(cap));

      column.capabilities.sort((a, b) => a - b);
    }

    return column;
  } catch (e) {}

  return column;
};
