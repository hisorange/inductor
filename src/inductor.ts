import { Migrator } from './library/migrator';
import { Modeller } from './library/modeller';
import { Plan } from './library/plan';
import { IConfig } from './types/config.interface';
import { IStepResult } from './types/step-result.interface';
import { ITable } from './types/table.interface';

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
  readonly modeller: Modeller;

  constructor(readonly config: IConfig) {
    this.migrator = new Migrator(this.id, config);

    this.modeller = new Modeller(this.migrator);
    this.modeller.setTables(config.tables);
  }

  /**
   * Compare the given state with the current database state, and return with a change plan.
   */
  compare(tables: ITable[]): Promise<Plan> {
    return this.migrator.compare(tables);
  }

  /**
   * Alter the database state to match the given state.
   */
  set(tables: ITable[]): Promise<IStepResult[]> {
    return this.migrator
      .compare(tables)
      .then(plan => plan.execute())
      .then(result => {
        this.modeller.setTables(tables);

        return result;
      });
  }

  /**
   * Read the current database state.
   */
  read(filters: string[] = []): Promise<ITable[]> {
    return this.migrator.read(filters).then(state => {
      this.modeller.setTables(state);
      return state;
    });
  }

  close() {
    return this.migrator.connection.destroy();
  }
}
