import { Knex } from 'knex';
import { IMigrationManager } from '../../migration';

export interface ICache {
  readonly knex: Knex;
  readonly migrationManager: IMigrationManager;
  readonly tableName: string;

  has(key: string): Promise<boolean>;
  set(key: string, value: any, ttl: number | undefined): Promise<void>;
  get<R = unknown>(key: string): Promise<R | undefined>;

  clear(): Promise<void>;
}
