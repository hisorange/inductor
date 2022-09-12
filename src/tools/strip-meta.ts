import cloneDeep from 'lodash.clonedeep';
import { IBlueprint } from '../blueprint';

export const stripMeta = (blueprint: IBlueprint) => {
  blueprint = cloneDeep(blueprint);

  delete blueprint.meta;

  for (const columnRef in blueprint.columns) {
    delete blueprint.columns[columnRef].meta;
    delete blueprint.columns[columnRef].propertyName;
  }

  for (const uniqueName in blueprint.uniques) {
    delete blueprint.uniques[uniqueName].meta;
  }

  for (const indexName in blueprint.indexes) {
    delete blueprint.indexes[indexName].meta;
  }

  for (const relName in blueprint.relations) {
    delete blueprint.relations[relName].meta;
    delete blueprint.relations[relName].propertyName;
  }

  return blueprint;
};
