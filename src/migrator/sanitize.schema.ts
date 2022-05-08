import { ColumnType } from '../enum/column-type.enum';
import { ISchema } from '../interface/schema.interface';

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
      if (
        [
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
        ].includes(definition.type)
      ) {
        definition.isUnique = false;
      }

      // Primary is not supported for these types
      if (
        [
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
        ].includes(definition.type)
      ) {
        definition.isPrimary = false;
      }

      // Primary keys cannot be nullable
      if (definition.isPrimary) {
        definition.isNullable = false;
      }
    }
  }

  return schema;
};
