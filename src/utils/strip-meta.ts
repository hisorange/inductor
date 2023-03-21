import cloneDeep from 'lodash.clonedeep';
import { ITable } from '../types/table.interface';

export const stripMeta = (table: ITable) => {
  table = cloneDeep(table);

  delete table.meta;

  for (const columnRef in table.columns) {
    delete table.columns[columnRef].meta;
    delete table.columns[columnRef].propertyName;
  }

  for (const uniqueName in table.uniques) {
    delete table.uniques[uniqueName].meta;
  }

  for (const indexName in table.indexes) {
    delete table.indexes[indexName].meta;
  }

  for (const relName in table.relations) {
    delete table.relations[relName].meta;
    delete table.relations[relName].propertyName;
  }

  return table;
};
