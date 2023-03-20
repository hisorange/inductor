import cloneDeep from 'lodash.clonedeep';
import { ISchema } from '../schema';

export const stripMeta = (schema: ISchema) => {
  schema = cloneDeep(schema);

  delete schema.meta;

  for (const columnRef in schema.columns) {
    delete schema.columns[columnRef].meta;
    delete schema.columns[columnRef].propertyName;
  }

  for (const uniqueName in schema.uniques) {
    delete schema.uniques[uniqueName].meta;
  }

  for (const indexName in schema.indexes) {
    delete schema.indexes[indexName].meta;
  }

  for (const relName in schema.relations) {
    delete schema.relations[relName].meta;
    delete schema.relations[relName].propertyName;
  }

  return schema;
};
