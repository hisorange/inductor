import winston, { Logger, createLogger } from 'winston';
import { Migrator } from './library/migrator';
import { ModelManager } from './library/model.manager';
import { Plan } from './library/plan';
import { IConfig } from './types/config.interface';
import { IDatabase } from './types/database.interface';
import { IStepResult } from './types/step-result.interface';
import { migrateTableDescriptor } from './utils/migrate-table-descriptor';

export class Inductor {
  /**
   * Session ID for this instance, allows to track the logs, and queries.
   */
  readonly id: string = Date.now().toString(36);

  /**
   * Migrator is responsible for applying the changes to the database.
   */
  readonly migrator: Migrator;

  /**
   * Table models manager, responsible to translate the table descriptors to database state.
   */
  readonly models: ModelManager;

  constructor(
    readonly config: IConfig,
    readonly state: IDatabase = {
      meta: {
        id: 'inductor',
      },
      tables: [],
    },
    readonly logger?: Logger,
  ) {
    if (!this.logger) {
      this.logger = createLogger({
        defaultMeta: { inductor: this.id },
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        silent: process.env.NODE_ENV == 'test',
        transports: [new winston.transports.Console()],
      });
    }

    // Migrate the table descriptors on the database state
    for (const table of this.state.tables) {
      migrateTableDescriptor(table);
    }

    this.migrator = new Migrator(this.id, this.config, this.state, this.logger);
    this.models = new ModelManager(this.migrator, this.state, this.logger);
  }

  /**
   * Compare the given state with the current database state, and return with a change plan.
   */
  compare(withState: IDatabase): Promise<Plan> {
    return this.migrator.compare(withState);
  }

  /**
   * Alter the database state to match the given state.
   */
  set(desiredState: IDatabase): Promise<IStepResult[]> {
    for (const table of desiredState.tables) {
      migrateTableDescriptor(table);
    }

    return this.migrator
      .compare(desiredState)
      .then(plan => plan.execute())
      .then(result => {
        this.models.setTables(desiredState.tables);

        return result;
      });
  }

  /**
   * Read the current database state.
   */
  read(filters: string[] = []): Promise<IDatabase> {
    return this.migrator.read(filters).then(newState => {
      this.models.setTables(newState.tables);
      return newState;
    });
  }

  close() {
    return this.migrator.connection.destroy();
  }
}
