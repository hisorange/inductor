import { PostgresIndexType } from './postgres/postgres.index-type';

export interface ICompositeIndex<IndexMeta = unknown> {
  type: PostgresIndexType;
  columns: string[];
  meta?: IndexMeta;
}
