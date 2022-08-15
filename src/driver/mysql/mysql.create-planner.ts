import { IBlueprint } from '../../interface';
import { ICreatePlanner } from '../../interface/migration/create-planner.interface';

export class MySQLCreatePlanner implements ICreatePlanner {
  async createTable(blueprint: IBlueprint): Promise<void> {}
}
