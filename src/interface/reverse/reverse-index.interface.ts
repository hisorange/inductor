import { PostgresIndexType } from '../schema/postgres/postgres.index-type';

export interface IReverseIndex {
  name: string;
  columns: string[];
  type: PostgresIndexType;
}
