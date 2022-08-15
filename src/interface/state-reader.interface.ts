import { IBlueprint } from './blueprint';

export interface IStateReader {
  reverse(table: string): IBlueprint;
}
