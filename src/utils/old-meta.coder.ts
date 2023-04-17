import { IRelation } from '../types/relation.interface';

type RelationMeta = {
  a?: string; // alias
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
