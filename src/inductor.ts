import { Model, ModelClass } from 'objection';
import { Migrator } from './library/migrator';
import { ModelManager } from './library/model.manager';
import { Plan } from './library/plan';
import { IDatabase } from './types/database.interface';
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
  readonly models: ModelManager;

  constructor(readonly database: IDatabase) {
    this.migrator = new Migrator(this.id, database);

    this.models = new ModelManager(this.migrator);
    this.models.setTables(database.tables);
  }

  compareState(tables: ITable[]): Promise<Plan> {
    return this.migrator.compareDatabaseState(tables);
  }

  async setState(tables: ITable[]): Promise<IStepResult[]> {
    return this.compareState(tables)
      .then(plan => plan.execute())
      .then(result => {
        this.models.setTables(tables);

        return result;
      });
  }

  async readState(filters: string[] = []): Promise<ITable[]> {
    return this.migrator.readDatabaseState(filters).then(state => {
      this.models.setTables(state);
      return state;
    });
  }

  getModel<T extends Model = Model>(table: string): ModelClass<T> {
    return this.models.getModel<T>(table);
  }

  closeConnection() {
    return this.migrator.knex.destroy();
  }

  getTableDescriptors(): ITable[] {
    return Array.from(this.models.getTableMap().values()).map(
      ({ table }) => table,
    );
  }

  getModels(): ModelClass<Model>[] {
    return Array.from(this.models.getTableMap().values()).map(
      ({ model }) => model,
    );
  }
}
