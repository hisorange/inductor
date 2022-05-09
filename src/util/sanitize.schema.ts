import { ColumnType } from '../enum/column-type.enum';
import { ISchema } from '../interface/schema.interface';

const primaryTester = [
  ColumnType.BOX,
  ColumnType.CIRCLE,
  ColumnType.JSON,
  ColumnType.LINE,
  ColumnType.LSEG,
  ColumnType.PATH,
  ColumnType.PG_SNAPSHOT,
  ColumnType.POINT,
  ColumnType.POLYGON,
  ColumnType.TXID_SNAPSHOT,
  ColumnType.XML,
];

const uniqueTester = [
  ColumnType.BOX,
  ColumnType.CIRCLE,
  ColumnType.JSON,
  ColumnType.JSONB,
  ColumnType.LINE,
  ColumnType.LSEG,
  ColumnType.PATH,
  ColumnType.PG_SNAPSHOT,
  ColumnType.POINT,
  ColumnType.POLYGON,
  ColumnType.TXID_SNAPSHOT,
  ColumnType.XML,
];

export const sanitizeSchema = (schema: ISchema) => {
  for (const name in schema.columns) {
    if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
      const definition = schema.columns[name];

      // Serial columns cannot be nullable
      if (
        [
          ColumnType.BIGSERIAL,
          ColumnType.SERIAL,
          ColumnType.SMALLSERIAL,
        ].includes(definition.type)
      ) {
        definition.isNullable = false;
      }

      // Unique is not supported for these types
      if (uniqueTester.includes(definition.type)) {
        definition.isUnique = false;
      }

      // Primary is not supported for these types
      if (primaryTester.includes(definition.type)) {
        definition.isPrimary = false;
      }

      // Primary keys cannot be nullable
      if (definition.isPrimary) {
        definition.isNullable = false;
      }

      // Primary keys are unique by design
      if (definition.isPrimary) {
        definition.isUnique = false;
      }
    }
  }

  // Validate the compositive unique fields for valid types
  for (const name in schema.uniques) {
    const validColumns: string[] = [];

    if (Object.prototype.hasOwnProperty.call(schema.uniques, name)) {
      const expectedColumns = schema.uniques[name];

      for (const columnName of expectedColumns) {
        // Check if the column exists
        if (Object.prototype.hasOwnProperty.call(schema.columns, columnName)) {
          const columnDef = schema.columns[columnName];

          // Check if the column can be unique
          if (!uniqueTester.includes(columnDef.type)) {
            validColumns.push(columnName);
          }
        }
      }
    }

    // If there are no valid columns, remove the composite unique
    if (validColumns.length === 0) {
      delete schema.uniques[name];
    }
    // If there are valid columns, update the composite unique
    else {
      schema.uniques[name] = validColumns;
    }
  }

  return schema;
};
