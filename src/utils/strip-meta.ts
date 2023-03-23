import cloneDeep from 'lodash.clonedeep';
import { ITable } from '../types/table.interface';

export const stripMeta = (table: ITable) => {
  table = cloneDeep(table);

  delete table.meta;

  for (const columnRef in table.columns) {
    delete table.columns[columnRef].meta;
  }

  for (const uniqueName in table.uniques) {
    delete table.uniques[uniqueName].meta;
  }

  for (const indexName in table.indexes) {
    delete table.indexes[indexName].meta;
  }

  for (const relName in table.relations) {
    delete table.relations[relName].meta;
  }

  return table;
};
