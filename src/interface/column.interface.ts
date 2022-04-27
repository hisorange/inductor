import { ColumnType } from '../enum/column-type.enum';

export interface IColumn {
  kind: 'column';
  type: ColumnType;
}
