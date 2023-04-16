import { ColumnHook } from '../types/column-hook.enum';
import { ColumnCapability } from '../types/column.capability';
import { IColumn } from '../types/column.interface';
import { IRelation } from '../types/relation.interface';
import { ITable } from '../types/table.interface';

type ColumnMeta = {
  c?: number; // capabilities
  a?: string; // alias
  t?: number; // transformers
};

type RelationMeta = {
  a?: string; // alias
};

type TableMeta = {
  a?: string; // alias
};

export const encodeColumnMeta = (column: IColumn): string => {
  const meta: ColumnMeta = {};

  if (column.meta.capabilities?.length) {
    meta.c = 0;

    for (const cap of column.meta.capabilities.sort()) {
      meta.c = meta.c! | cap;
    }
  }

  if (column?.meta?.transformers?.length) {
    meta.t = 0;

    for (const transformer of column.meta.transformers.sort()) {
      meta.t = meta.t! | transformer;
    }
  }

  if (column.meta.alias) {
    meta.a = column.meta.alias;
  }

  return Object.keys(meta).length ? JSON.stringify(meta) : '';
};

export const decodeColumnMeta = (column: IColumn, comment: string): IColumn => {
  // Skip on empty comment
  if (!comment || !comment.length || comment === '{}') {
    return column;
  }

  try {
    let meta: ColumnMeta = JSON.parse(comment) as ColumnMeta;

    if (meta.c && typeof meta.c === 'number') {
      column.meta.capabilities = [];

      [
        ColumnCapability.CREATED_AT,
        ColumnCapability.UPDATED_AT,
        ColumnCapability.DELETED_AT,
      ].forEach(cap => meta.c! & cap && column.meta.capabilities!.push(cap));

      column.meta.capabilities.sort((a, b) => a - b);
    }

    if (meta.t && typeof meta.t === 'number') {
      column.meta.transformers = [];

      [
        ColumnHook.JSON,
        ColumnHook.BASE16,
        ColumnHook.BASE64,
        ColumnHook.KEBAB,
        ColumnHook.SNAKE,
        ColumnHook.PASSWORD,
      ].forEach(cap => meta.t! & cap && column.meta.transformers!.push(cap));

      column.meta.transformers.sort((a, b) => a - b);
    }

    if (meta.a && typeof meta.a === 'string') {
      column.meta.alias = meta.a;
    }

    return column;
  } catch (e) {}

  return column;
};

export const encodeRelationMeta = (relation: IRelation): string => {
  const meta: RelationMeta = {};

  if (relation.alias) {
    meta.a = relation.alias;
  }

  return Object.keys(meta).length ? JSON.stringify(meta) : '';
};

export const decodeRelationMeta = (
  relation: IRelation,
  comment: string,
): IRelation => {
  // Skip on empty comment
  if (!comment || !comment.length || comment === '{}') {
    return relation;
  }

  try {
    let meta: RelationMeta = JSON.parse(comment) as RelationMeta;

    if (meta.a && typeof meta.a === 'string') {
      relation.alias = meta.a;
    }

    return relation;
  } catch (e) {}

  return relation;
};

export const encodeTableMeta = (table: ITable): string => {
  const meta: TableMeta = {};

  if (table?.meta?.alias) {
    meta.a = table.meta.alias;
  }

  return Object.keys(meta).length ? JSON.stringify(meta) : '';
};

export const decodeTableMeta = (table: ITable, comment: string) => {
  // Skip on empty comment
  if (!comment || !comment.length || comment === '{}') {
    return;
  }

  try {
    let meta: TableMeta = JSON.parse(comment) as TableMeta;

    if (meta.a && typeof meta.a === 'string') {
      table.meta.alias = meta.a;
    }
  } catch (e) {}
};
