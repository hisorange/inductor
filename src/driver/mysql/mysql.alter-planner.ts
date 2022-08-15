import { IBlueprint } from '../../interface';
import { IAlterPlanner } from '../../interface/migration/alter-planner.interface';

export class MySQLAlterPlanner implements IAlterPlanner {
  async alterTable(blueprint: IBlueprint): Promise<void> {}
}
