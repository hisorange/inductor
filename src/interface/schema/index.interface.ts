import { PostgresIndexType } from '../../driver/postgres/postgres.index-type';

export interface ICompositiveIndex<IndexMeta = unknown> {
  type: PostgresIndexType;
  columns: string[];
  meta?: IndexMeta;
}
