import { IColumn } from '../blueprint';
import { ColumnCapability } from '../blueprint/types/column.capability';

type CO = {
  c?: number; // capabilities
};

export const commentEncoder = (column: IColumn): string => {
  const r: CO = {};

  if (column.capabilities.length) {
    r.c = 0;

    for (const cap of column.capabilities.sort()) {
      r.c = r.c! | cap;
    }
  }

  return JSON.stringify(r);
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
    }

    return column;
  } catch (e) {}

  return column;
};
