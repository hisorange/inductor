import { Migrator } from './library/migrator';
import { ModelManager } from './library/model.manager';
import { Plan } from './library/plan';
import { IConfig } from './types/config.interface';
import { IDatabase } from './types/database.interface';
import { IStepResult } from './types/step-result.interface';

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

  constructor(readonly config: IConfig, readonly database: IDatabase) {
    this.migrator = new Migrator(this.id, config, this.database);
    this.models = new ModelManager(this.migrator, database);
  }

  /**
   * Compare the given state with the current database state, and return with a change plan.
   */
  compare(state: IDatabase): Promise<Plan> {
    return this.migrator.compare(state);
  }

  /**
   * Alter the database state to match the given state.
   */
  set(state: IDatabase): Promise<IStepResult[]> {
    return this.migrator
      .compare(state)
      .then(plan => plan.execute())
      .then(result => {
        this.models.setTables(state.tables);

        return result;
      });
  }

  /**
   * Read the current database state.
   */
  read(filters: string[] = []): Promise<IDatabase> {
    return this.migrator.read(filters).then(state => {
      this.models.setTables(state.tables);
      return state;
    });
  }

  close() {
    return this.migrator.connection.destroy();
  }
}
