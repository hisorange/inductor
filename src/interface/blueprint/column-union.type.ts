import { MySQLColumnType } from './mysql';
import { PostgresColumnType } from './postgres';

export type ColumnType = PostgresColumnType | MySQLColumnType;
