import { ITable } from './table.interface';

export interface IDatabase {
  meta: {
    id: string;
    [key: string]: any;
  };

  tables: ITable[];

  // views: IView[];
}
