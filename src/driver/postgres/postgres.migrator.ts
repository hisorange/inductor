import { Knex } from 'knex';
import { Logger } from 'pino';
import { IFacts } from '../../interface/facts.interface';
import { IMigrationPlan } from '../../interface/migration/migration-plan.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { ISchema } from '../../interface/schema/schema.interface';
import { SchemaKind } from '../../interface/schema/schema.kind';
import { MigrationPlan } from '../../migration.plan';
import { alterTable } from './migrator/alter.table';
import { createTable } from './migrator/create.table';
import { reverseTable } from './migrator/reverse.table';

// Calculates and applies the changes on the database
export class PostgresMigrator implements IMigrator {
  /**
   * Initialize the migrator
   */
  constructor(
    readonly logger: Logger,
    protected knex: Knex,
    protected facts: IFacts,
  ) {}

  /**
   * Read the database state and return it as a list of schemas.
   */
  async readState(filters: string[] = []): Promise<ISchema[]> {
    const schemas = [];

    await this.facts.refresh();

    for (const table of this.facts.getListOfTables(filters)) {
      const schema = await reverseTable(this.facts, table);

      schemas.push(schema);
    }

    return schemas;
  }

  async cmpState(schemas: ISchema[]): Promise<IMigrationPlan> {
    const changePlan = new MigrationPlan(this.logger);

    await this.facts.refresh();

    for (let targetState of schemas) {
      this.logger.debug('Processing schema %s', targetState.tableName);

      if (targetState.kind === SchemaKind.TABLE) {
        // If the table doesn't exist, create it
        if (!this.facts.isTableExists(targetState.tableName)) {
          await createTable(
            this.knex.schema,
            targetState,
            this.facts,
            changePlan,
          );
        }
        // If the table exists, compare the state and apply the alterations
        else {
          const currentState = await reverseTable(
            this.facts,
            targetState.tableName,
          );

          await alterTable(
            this.knex.schema,
            currentState,
            targetState,
            changePlan,
          );
        }
      }
    }

    return changePlan;
  }

  /**
   * Reads the connection's database into a set of structure, and update it to match the schemas
   */
  async setState(schemas: ISchema[]): Promise<void> {
    const changePlan = await this.cmpState(schemas);
    await changePlan.apply();
  }

  async dropSchema(schema: ISchema): Promise<void> {
    await this.dropTable(schema.tableName);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.knex.schema.dropTableIfExists(tableName);
  }
}
