import { ColumnTools } from '../../../column-tools';
import { IColumn } from '../../../interface/schema/column.interface';
import { ColumnKind } from '../../../interface/schema/column.kind';
import { createSchema } from '../../../util/create-schema';
import { PostgresColumnType } from '../postgres.column-type';
import { PostgresInspector } from '../postgres.inspector';
import { postgresValidateSchema } from '../postgres.schema-validator';

export const reverseTable = async (
  inspector: PostgresInspector,
  tableName: string,
) => {
  const schema = createSchema(tableName);
  const columns = await inspector.columnInfo(tableName);
  const compositivePrimaryKeys = await inspector.getCompositePrimaryKeys(
    tableName,
  );
  const compositiveUniques = await inspector.getCompositeUniques(tableName);
  const indexes = await inspector.getIndexes(tableName);
  const defaultValues = await inspector.getDefaultValues(tableName);

  const singleColumnIndexes = indexes.filter(
    index => index.columns.length === 1,
  );
  const compositiveIndexes = indexes.filter(index => index.columns.length > 1);

  for (const compositiveIndex of compositiveIndexes) {
    schema.indexes[compositiveIndex.name] = {
      columns: compositiveIndex.columns,
      type: compositiveIndex.type,
    };
  }

  // Merge compositive uniques into the schema, but remove the table prefix from the name
  for (const [name, uniques] of Object.entries(compositiveUniques)) {
    schema.uniques[name] = uniques;
  }

  const enumColumns = await inspector.findEnumeratorColumns(tableName, columns);

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

    // Determine if the column is a compositive primary key
    if (isSerial || compositivePrimaryKeys.includes(column.name)) {
      isPrimary = true;
    }

    // Primary/serial cannot be unique or nullable
    if (isPrimary || isSerial) {
      column.is_nullable = false;
      column.is_unique = false;
    }

    let isIndexed: IColumn['isIndexed'] = false;

    const singleColumnIndex = singleColumnIndexes.find(index =>
      index.columns.includes(column.name),
    );

    // Determine if the column is an index
    if (singleColumnIndex) {
      isIndexed = singleColumnIndex.type;
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

    schema.columns[column.name] = columnDef;
  }

  // Process foreign keys
  const foreignKeys = await inspector.getForeignKeys(tableName);

  // TODO process for 1 unique on local, or compositive unique with the same order
  for (const [relationName, relationDefinition] of foreignKeys) {
    schema.relations[relationName] = relationDefinition;

    // Check if the local column is a primary key or has unique on it
    if (
      schema.relations[relationName].columns.every(cName => {
        const column = schema.columns[cName];

        // Simple unique
        if (column.isPrimary || column.isUnique) {
          return true;
        }
      })
    ) {
      schema.relations[relationName].isLocalUnique = true;
    }
  }

  postgresValidateSchema(schema);

  return schema;
};

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
