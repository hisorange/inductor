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

const isSerialType = (type: PostgresColumnType) => {
  switch (type) {
    case PostgresColumnType.SMALLSERIAL:
    case PostgresColumnType.SERIAL:
    case PostgresColumnType.BIGSERIAL:
      return true;
    default:
      return false;
  }
};

export class PostgresStateReader {
  constructor(protected facts: IFactCollector) {}

  async reverse(tableName: string): Promise<IBlueprint> {
    const blueprint = createBlueprint(tableName);
    blueprint.relations = this.facts.getTableForeignKeys(tableName);
    blueprint.uniques = this.facts.getTableUniques(tableName);
    blueprint.indexes = this.facts.getTableIndexes(tableName);

    const compositePrimaryKeys = this.facts.getTablePrimaryKeys(tableName);

    const [columns, defaultValues] = await Promise.all([
      this.facts.getTableColumns(tableName),
      this.facts.getTableDefaultValues(tableName),
    ]);
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
      let type = column.data_type as PostgresColumnType;

      // Determine if the column is a serial
      if (
        typeof column?.default_value === 'string' &&
        column.default_value.startsWith('nextval')
      ) {
        switch (type) {
          case PostgresColumnType.SMALLINT:
            type = PostgresColumnType.SMALLSERIAL;
            break;
          case PostgresColumnType.INTEGER:
            type = PostgresColumnType.SERIAL;
            break;
          case PostgresColumnType.BIGINT:
            type = PostgresColumnType.BIGSERIAL;
            break;
        }
      }

      let isPrimary = column.is_primary_key;
      const isSerial = isSerialType(type);

      // Determine if the column is a composite primary key
      if (isSerial || compositePrimaryKeys.includes(column.name)) {
        isPrimary = true;
      }

      // Primary/serial cannot be unique or nullable
      if (isPrimary || isSerial) {
        column.is_nullable = false;
        column.is_unique = false;
      }

      let isIndexed: IColumn['isIndexed'] = false;

      // Determine if the column is an index
      if (singleColumnIndexes.has(column.name)) {
        isIndexed = singleColumnIndexes.get(column.name)!;
      }

      const columnDef: IColumn = {
        type: {
          name: type,
        } as IColumn['type'],
        kind: ColumnKind.COLUMN,
        isNullable: column.is_nullable,
        isUnique: column.is_unique,
        isPrimary,
        isIndexed,
        defaultValue: undefined,
      };

      // Check for precision
      if (ColumnTools.postgres.isTypeRequiresPrecision(type)) {
        (columnDef.type as any).precision = column.numeric_precision;
      }
      // Check for scale
      if (ColumnTools.postgres.isTypeRequiresScale(type)) {
        (columnDef.type as any).scale = column.numeric_scale;
      }
      // Check for length
      if (ColumnTools.postgres.isTypeRequiresLength(type)) {
        (columnDef.type as any).length = column.max_length;
      }

      // Numeric can have precision and scale
      if (PostgresColumnType.NUMERIC === type) {
        // Check if the precision is set
        if (column.numeric_precision !== null) {
          (columnDef.type as any).precision = column.numeric_precision;
        }

        // Check if the scale is set
        if (column.numeric_scale !== null) {
          (columnDef.type as any).scale = column.numeric_scale;
        }
      }

      let defaultValue: IColumn['defaultValue'] = defaultValues.find(
        r => r.column === column.name,
      )?.defaultValue;

      // JSON columns need to get converted to strings
      if (typeof defaultValue === 'string') {
        // JSON columns need to get converted to strings
        if (
          type === PostgresColumnType.JSON ||
          type === PostgresColumnType.JSONB
        ) {
          try {
            defaultValue = JSON.parse(defaultValue);
          } catch (error) {}
        }
        // Boolean columns need to get converted to booleans
        else if (type === PostgresColumnType.BOOLEAN) {
          defaultValue = defaultValue === 'true';
        }
        // Numeric columns need to get converted to numbers
        else if (ColumnTools.postgres.isFloatType(columnDef)) {
          defaultValue = parseFloat(defaultValue);

          if (isNaN(defaultValue)) {
            defaultValue = undefined;
          }
        }
        // Integer columns need to get converted to numbers
        else if (ColumnTools.postgres.isIntegerType(columnDef)) {
          defaultValue = parseInt(defaultValue, 10);

          if (isNaN(defaultValue)) {
            defaultValue = undefined;
          }
        }
      }

      columnDef.defaultValue = defaultValue;

      const enumColDef = enumColumns.find(e => e.column == column.name);

      // Enum column check
      if (enumColDef) {
        columnDef.type = {
          name: PostgresColumnType.ENUM,
          values: enumColDef.values,
          nativeName: column.data_type,
        };
      }

      blueprint.columns[column.name] = columnDef;
    }

    PostgresValidator(blueprint);

    return blueprint;
  }
}
