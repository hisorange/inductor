import { Knex } from 'knex';
import { Logger } from 'pino';
import { ISchema } from '../../interface/schema.interface';
import { alterTable } from './migrator/alter.table';
import { createTable } from './migrator/create.table';
import { reverseTable } from './migrator/reverse.table';
import { PostgresInspector } from './postgres.inspector';

// Calculates and applies the changes on the database
export class PostgresMigrator {
  /**
   * Initialize the migrator
   */
  constructor(
    readonly logger: Logger,
    readonly inspector: PostgresInspector,
    protected knex: Knex,
  ) {}

  /**
   * Read the database state and return it as a list of schemas.
   */
  async readState(): Promise<ISchema[]> {
    const schemas = [];

    for (const table of await this.inspector.tables()) {
      const schema = await reverseTable(this.inspector, table);

      schemas.push(schema);
    }

    return schemas;
  }

  async cmpState(schemas: ISchema[]): Promise<Knex.SchemaBuilder[]> {
    const tables = await this.inspector.tables();
    const changes: Knex.SchemaBuilder[] = [];

    for (let targetState of schemas) {
      this.logger.debug('Processing schema %s', targetState.tableName);

      if (targetState.kind === 'table') {
        // If the table doesn't exist, create it
        if (!tables.includes(targetState.tableName)) {
          changes.push(createTable(this.knex.schema, targetState));
        }
        // If the table exists, compare the state and apply the alterations
        else {
          const currentState = await reverseTable(
            this.inspector,
            targetState.tableName,
          );

          changes.push(alterTable(this.knex.schema, currentState, targetState));
        }
      }
    }

    return changes;
  }

  /**
   * Reads the connection's database into a set of structure, and update it to match the schemas
   */
  async setState(schemas: ISchema[]): Promise<void> {
    const changes = await this.cmpState(schemas);

    if (changes.length) {
      this.logger.info('Applying [%d] changes', changes.length);

      for (const query of changes) {
        const sql = query.toQuery();

        if (sql.length) {
          this.logger.debug(sql);
        }

        await query;
      }
    }
  }
}
