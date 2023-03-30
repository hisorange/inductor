import { IndexType } from './index-type.enum';

export interface ICompositeIndex {
  type: IndexType;
  columns: string[];
}
