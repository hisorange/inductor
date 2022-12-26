import { Knex } from 'knex';
import { Migrator } from '../../migration';

export interface ICache {
  readonly knex: Knex;
  readonly migrator: Migrator;
  readonly tableName: string;

  has(key: string): Promise<boolean>;
  set(key: string, value: any, ttl: number | undefined): Promise<void>;
  get<R = unknown>(key: string): Promise<R | undefined>;

  clear(): Promise<void>;
}
