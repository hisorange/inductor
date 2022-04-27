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
    }
  }

  return schema;
};
