import { ColumnCapability } from '../types/column.capability';
import { IColumn } from '../types/column.interface';
import { IRelation } from '../types/relation.interface';
import { Transformers } from '../types/transformers.enum';

type ColumnMeta = {
  c?: number; // capabilities
  a?: string; // alias
  t?: number; // transformers
};

type RelationMeta = {
  a?: string; // alias
};

export const encodeColumnMeta = (column: IColumn): string => {
  const meta: ColumnMeta = {};

  if (column.capabilities?.length) {
    meta.c = 0;

    for (const cap of column.capabilities.sort()) {
      meta.c = meta.c! | cap;
    }
  }

  if (column?.transformers?.length) {
    meta.t = 0;

    for (const transformer of column.transformers.sort()) {
      meta.t = meta.t! | transformer;
    }
  }

  if (column.alias) {
    meta.a = column.alias;
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
      column.capabilities = [];

      [
        ColumnCapability.CREATED_AT,
        ColumnCapability.UPDATED_AT,
        ColumnCapability.DELETED_AT,
      ].forEach(cap => meta.c! & cap && column.capabilities!.push(cap));

      column.capabilities.sort((a, b) => a - b);
    }

    if (meta.t && typeof meta.t === 'number') {
      column.transformers = [];

      [
        Transformers.JSON,
        Transformers.BASE16,
        Transformers.BASE64,
        Transformers.KEBAB,
        Transformers.SNAKE,
        Transformers.PASSWORD,
      ].forEach(cap => meta.t! & cap && column.transformers!.push(cap));

      column.transformers.sort((a, b) => a - b);
    }

    if (meta.a && typeof meta.a === 'string') {
      column.alias = meta.a;
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
