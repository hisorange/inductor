import { IndexType } from './index-type.enum';

export interface ICompositeIndex<IndexMeta = unknown> {
  type: IndexType;
  columns: string[];
  meta?: IndexMeta;
}
