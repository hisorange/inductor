import { PostgresIndexType } from '../driver/postgres/postgres.index-type';

export interface IIndex {
  name: string;
  columns: string[];
  type: PostgresIndexType;
}
