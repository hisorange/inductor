import {
  ColumnKind,
  ColumnType,
  IBlueprint,
  IColumn,
  IndexType,
} from '../blueprint';
import { initBlueprint } from '../blueprint/blueprint.initiator';
import { validateBlueprint } from '../blueprint/blueprint.validator';

import { ColumnTools } from '../tools/column-tools';
import { IFactCollector } from './types';
import { IFactReader } from './types/fact-reader.interface';

export class FactReader implements IFactReader {
  constructor(protected facts: IFactCollector) {}

  reverse(tableName: string): IBlueprint {
    const blueprint = initBlueprint(tableName);
    blueprint.relations = this.facts.getTableForeignKeys(tableName);
    blueprint.uniques = this.facts.getTableUniques(tableName);
    blueprint.indexes = this.facts.getTableIndexes(tableName);

    const compositePrimaryKeys = this.facts.getTablePrimaryKeys(tableName);
    const columns = this.facts.getTableColumnInfo(tableName);
    const enumerators = this.facts.getTableEnumerators(tableName);

    const singleColumnIndexes = new Map<string, IndexType>();
    const singleColumnUniques = new Set<string>();

    // Remove non-composite indexes
    for (const index in blueprint.indexes) {
      if (Object.prototype.hasOwnProperty.call(blueprint.indexes, index)) {
        const definition = blueprint.indexes[index];

        if (definition.columns.length === 1) {
          singleColumnIndexes.set(definition.columns[0], definition.type);

          delete blueprint.indexes[index];
        }
      }
    }

    // Remove non-composite uniques
    for (const constraint in blueprint.uniques) {
      if (Object.prototype.hasOwnProperty.call(blueprint.uniques, constraint)) {
        const definition = blueprint.uniques[constraint];

        if (definition.columns.length < 2) {
          singleColumnUniques.add(definition.columns[0]);
          delete blueprint.uniques[constraint];
        }
      }
    }

    for (const columnName of Object.keys(columns)) {
      const columnInfo = columns[columnName];
      const columnDef: IColumn = {
        type: {
          name: columnInfo.typeName,
        } as IColumn['type'],
        kind: ColumnKind.COLUMN,
        isNullable: columnInfo.isNullable,
        isUnique: singleColumnUniques.has(columnName),
        isPrimary: compositePrimaryKeys.includes(columnName),
        isIndexed: false,
        defaultValue: columnInfo.defaultValue,
      };

      columnDef.isIndexed = singleColumnIndexes.has(columnName)
        ? singleColumnIndexes.get(columnName)!
        : false;

      // Enum column check
      if (enumerators.hasOwnProperty(columnName)) {
        columnDef.type = {
          name: ColumnType.ENUM,
          values: enumerators[columnName].values,
          nativeName: enumerators[columnName].nativeType,
        };
      }

      // Determine if the column is a serial
      if (
        typeof columnDef.defaultValue === 'string' &&
        columnDef.defaultValue.toLowerCase().startsWith('nextval')
      ) {
        columnDef.isPrimary = true;

        switch (columnDef.type.name) {
          case ColumnType.SMALLINT:
            columnDef.type.name = ColumnType.SMALLSERIAL;
            break;
          case ColumnType.INTEGER:
            columnDef.type.name = ColumnType.SERIAL;
            break;
          case ColumnType.BIGINT:
            columnDef.type.name = ColumnType.BIGSERIAL;
            break;
        }
      }

      // Primary/serial cannot be unique or nullable
      if (columnDef.isPrimary) {
        columnDef.isNullable = false;
        columnDef.isUnique = false;
      }

      // Check for precision
      if (ColumnTools.isTypeRequiresPrecision(columnDef.type.name)) {
        (columnDef.type as any).precision = columnInfo.precision;
      }
      // Check for scale
      if (ColumnTools.isTypeRequiresScale(columnDef.type.name)) {
        (columnDef.type as any).scale = columnInfo.scale;
      }
      // Check for length
      if (ColumnTools.isTypeRequiresLength(columnDef.type.name)) {
        (columnDef.type as any).length = columnInfo.maxLength;
      }

      // Numeric can have precision and scale
      if (ColumnType.NUMERIC === columnDef.type.name) {
        // Check if the precision is set
        if (columnInfo.precision !== null) {
          (columnDef.type as any).precision = columnInfo.precision;
        }

        // Check if the scale is set
        if (columnInfo.scale !== null) {
          (columnDef.type as any).scale = columnInfo.scale;
        }
      }

      // JSON columns need to get converted to strings
      if (typeof columnDef.defaultValue === 'string') {
        // JSON columns need to get converted to strings
        if (
          columnDef.type.name === ColumnType.JSON ||
          columnDef.type.name === ColumnType.JSONB
        ) {
          try {
            columnDef.defaultValue = JSON.parse(columnDef.defaultValue);
          } catch (error) {}
        }
        // Boolean columns need to get converted to booleans
        else if (columnDef.type.name === ColumnType.BOOLEAN) {
          columnDef.defaultValue = columnDef.defaultValue === 'true';
        }
        // Numeric columns need to get converted to numbers
        else if (ColumnTools.isFloatType(columnDef)) {
          columnDef.defaultValue = parseFloat(columnDef.defaultValue);

          if (isNaN(columnDef.defaultValue)) {
            columnDef.defaultValue = undefined;
          }
        }
        // Integer columns need to get converted to numbers
        else if (ColumnTools.isIntegerType(columnDef)) {
          columnDef.defaultValue = parseInt(columnDef.defaultValue, 10);

          if (isNaN(columnDef.defaultValue)) {
            columnDef.defaultValue = undefined;
          }
        }
      }

      blueprint.columns[columnName] = columnDef;
    }

    validateBlueprint(blueprint);

    return blueprint;
  }
}
