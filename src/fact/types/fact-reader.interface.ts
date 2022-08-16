import { IBlueprint } from '../../blueprint';

export interface IFactReader {
  reverse(table: string): IBlueprint;
}
