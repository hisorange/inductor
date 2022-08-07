import { PostgresIndexType } from '../../driver/postgres/postgres.index-type';

export interface IReverseIndex {
  name: string;
  columns: string[];
  type: PostgresIndexType;
}
