import { IBlueprint } from '../../interface';
import { IStateReader } from '../../interface/state-reader.interface';
import { createBlueprint } from '../../util/create-blueprint';

export class MySQLStateReader implements IStateReader {
  reverse(table: string): IBlueprint {
    return createBlueprint(table);
  }
}
