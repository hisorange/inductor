import { ColumnTools } from '../../../component/column-tools';
import {
  ColumnKind,
  IBlueprint,
  IColumn,
  IFactCollector,
  PostgresColumnType,
  PostgresIndexType,
} from '../../../interface';
import { createBlueprint } from '../../../util/create-blueprint';
import { PostgresValidator } from '../postgres.validator';

export class PostgresStateReader {
  constructor(protected facts: IFactCollector) {}

  async reverse(tableName: string): Promise<IBlueprint> {
    const blueprint = createBlueprint(tableName);
    blueprint.relations = this.facts.getTableForeignKeys(tableName);
    blueprint.uniques = this.facts.getTableUniques(tableName);
    blueprint.indexes = this.facts.getTableIndexes(tableName);

    const compositePrimaryKeys = this.facts.getTablePrimaryKeys(tableName);
    const defaultValues = this.facts.getTableDefaultValues(tableName);

    const columns = await this.facts.getTableColumns(tableName);
    const enumColumns = await this.facts.findEnumeratorColumns(
      tableName,
      columns,
    );

    const singleColumnIndexes = new Map<string, PostgresIndexType>();

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
          delete blueprint.uniques[constraint];
        }
      }
    }

    for (const column of columns) {
      const columnName = column.name;
      const columnDef: IColumn = {
        type: {
          name: column.data_type,
        } as IColumn['type'],
        kind: ColumnKind.COLUMN,
        isNullable: column.is_nullable,
        isUnique: column.is_unique,
        isPrimary:
          column.is_primary_key || compositePrimaryKeys.includes(columnName),
        isIndexed: false,
        defaultValue: undefined,
      };

      columnDef.isIndexed = singleColumnIndexes.has(columnName)
        ? singleColumnIndexes.get(columnName)!
        : false;
      columnDef.defaultValue = defaultValues.hasOwnProperty(columnName)
        ? defaultValues[columnName]
        : undefined;

      const enumColDef = enumColumns.find(e => e.column == columnName);

      // Enum column check
      if (enumColDef) {
        columnDef.type = {
          name: PostgresColumnType.ENUM,
          values: enumColDef.values,
          nativeName: column.data_type,
        };
      }

      // Determine if the column is a serial
      if (
        typeof columnDef.defaultValue === 'string' &&
        columnDef.defaultValue.toLowerCase().startsWith('nextval')
      ) {
        columnDef.isPrimary = true;

        switch (columnDef.type.name) {
          case PostgresColumnType.SMALLINT:
            columnDef.type.name = PostgresColumnType.SMALLSERIAL;
            break;
          case PostgresColumnType.INTEGER:
            columnDef.type.name = PostgresColumnType.SERIAL;
            break;
          case PostgresColumnType.BIGINT:
            columnDef.type.name = PostgresColumnType.BIGSERIAL;
            break;
        }
      }

      // Primary/serial cannot be unique or nullable
      if (columnDef.isPrimary) {
        columnDef.isNullable = false;
        columnDef.isUnique = false;
      }

      // Check for precision
      if (ColumnTools.postgres.isTypeRequiresPrecision(columnDef.type.name)) {
        (columnDef.type as any).precision = column.numeric_precision;
      }
      // Check for scale
      if (ColumnTools.postgres.isTypeRequiresScale(columnDef.type.name)) {
        (columnDef.type as any).scale = column.numeric_scale;
      }
      // Check for length
      if (ColumnTools.postgres.isTypeRequiresLength(columnDef.type.name)) {
        (columnDef.type as any).length = column.max_length;
      }

      // Numeric can have precision and scale
      if (PostgresColumnType.NUMERIC === columnDef.type.name) {
        // Check if the precision is set
        if (column.numeric_precision !== null) {
          (columnDef.type as any).precision = column.numeric_precision;
        }

        // Check if the scale is set
        if (column.numeric_scale !== null) {
          (columnDef.type as any).scale = column.numeric_scale;
        }
      }

      // JSON columns need to get converted to strings
      if (typeof columnDef.defaultValue === 'string') {
        // JSON columns need to get converted to strings
        if (
          columnDef.type.name === PostgresColumnType.JSON ||
          columnDef.type.name === PostgresColumnType.JSONB
        ) {
          try {
            columnDef.defaultValue = JSON.parse(columnDef.defaultValue);
          } catch (error) {}
        }
        // Boolean columns need to get converted to booleans
        else if (columnDef.type.name === PostgresColumnType.BOOLEAN) {
          columnDef.defaultValue = columnDef.defaultValue === 'true';
        }
        // Numeric columns need to get converted to numbers
        else if (ColumnTools.postgres.isFloatType(columnDef)) {
          columnDef.defaultValue = parseFloat(columnDef.defaultValue);

          if (isNaN(columnDef.defaultValue)) {
            columnDef.defaultValue = undefined;
          }
        }
        // Integer columns need to get converted to numbers
        else if (ColumnTools.postgres.isIntegerType(columnDef)) {
          columnDef.defaultValue = parseInt(columnDef.defaultValue, 10);

          if (isNaN(columnDef.defaultValue)) {
            columnDef.defaultValue = undefined;
          }
        }
      }

      blueprint.columns[columnName] = columnDef;
    }

    PostgresValidator(blueprint);

    return blueprint;
  }
}
