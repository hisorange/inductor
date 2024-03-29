import type { Pojo } from 'objection';

export const encodeMetaComment = (meta: Record<string, any>) =>
  Object.keys(meta).length ? JSON.stringify(meta) : '';

export const decodeMetaComment = (comment: string): Pojo => {
  if (!comment || !comment.length || comment === '{}') {
    return {};
  }

  try {
    const result = JSON.parse(comment);

    if (typeof result !== 'object') {
      return {};
    }

    return result;
  } catch {
    return {};
  }
};
