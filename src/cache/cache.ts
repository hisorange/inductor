import { Knex } from 'knex';
import { IMigrationManager } from '../migration';
import { ICache } from './types/cache.interface';

export class Cache implements ICache {
  constructor(
    readonly tableName: string,
    readonly migrationManager: IMigrationManager,
    readonly knex: Knex,
  ) {}

  async has(key: string): Promise<boolean> {
    return !!(await this.knex
      .select('key')
      .from(this.tableName)
      .where({ key })
      .first());
  }

  async set(key: string, value: any, ttl: number | undefined): Promise<void> {
    await this.knex(this.tableName)
      .insert({
        key,
        value,
        expires: ttl ? Date.now() + ttl : undefined,
      })
      .onConflict('key')
      .merge();
  }

  async get<R = unknown>(key: string): Promise<R | undefined> {
    return (
      (
        await this.knex
          .select('value')
          .from(this.tableName)
          .where({ key })
          .first()
      ).value ?? undefined
    );
  }

  async clear(): Promise<void> {
    await this.knex(this.tableName).del();
  }
}
