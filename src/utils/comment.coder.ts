import { ColumnCapability } from '../types/column.capability';
import { IColumn } from '../types/column.interface';

type CO = {
  c?: number; // capabilities
};

export const commentEncoder = (column: IColumn): string => {
  if (column.capabilities.length) {
    const r: CO = {};

    r.c = 0;

    for (const cap of column.capabilities.sort()) {
      r.c = r.c! | cap;
    }

    return JSON.stringify(r);
  }

  return '';
};

export const commentDecode = (column: IColumn, comment: string): IColumn => {
  let r: CO;

  try {
    r = JSON.parse(comment) as CO;

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
