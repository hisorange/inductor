import { Knex } from 'knex';
import { Logger } from 'pino';
import { IChangePlan } from '../../interface/change-plan.interface';
import { IFacts } from '../../interface/facts.interface';
import { IMigrator } from '../../interface/migrator.interface';
import { ISchema } from '../../interface/schema/schema.interface';
import { SchemaKind } from '../../interface/schema/schema.kind';
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
  async readState(): Promise<ISchema[]> {
    const schemas = [];

    await this.facts.refresh();

    for (const table of this.facts.getListOfTables()) {
      const schema = await reverseTable(this.facts, table);

      schemas.push(schema);
    }

    return schemas;
  }

  async cmpState(schemas: ISchema[]): Promise<IChangePlan> {
    const changePlan: IChangePlan = { steps: [] };

    await this.facts.refresh();

    for (let targetState of schemas) {
      this.logger.debug('Processing schema %s', targetState.tableName);

      if (targetState.kind === SchemaKind.TABLE) {
        // If the table doesn't exist, create it
        if (!this.facts.isTableExists(targetState.tableName)) {
          changePlan.steps.push(
            createTable(this.knex.schema, targetState, this.facts),
          );
        }
        // If the table exists, compare the state and apply the alterations
        else {
          const currentState = await reverseTable(
            this.facts,
            targetState.tableName,
          );

          changePlan.steps.push(
            alterTable(this.knex.schema, currentState, targetState),
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

    if (changePlan.steps.length) {
      this.logger.info('Applying [%d] changes', changePlan.steps.length);

      for (const step of changePlan.steps) {
        const sql = step.toQuery();

        if (sql.length) {
          // console.log(step.toString());
          this.logger.debug(sql);
        }

        await step;
      }
    }
  }

  async dropSchema(schema: ISchema): Promise<void> {
    await this.knex.schema.dropTableIfExists(schema.tableName);
  }
}
