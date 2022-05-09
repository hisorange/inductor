import { ColumnType } from '../enum/column-type.enum';
import { Inspector } from '../inspector';
import { ISchema } from '../interface/schema.interface';
import { sanitizeSchema } from '../util/sanitize.schema';

export const reverseTable = async (inspector: Inspector, table: string) => {
  const schema: ISchema = {
    name: table,
    kind: 'table',
    columns: {},
  };
  const columns = await inspector.columnInfo(table);
  const compositivePrimaryKeys = await inspector.getCompositePrimaryKeys(table);

  for (const column of columns) {
    let type = column.data_type as ColumnType;

    // Determine if the column is a serial
    if (
      typeof column?.default_value === 'string' &&
      column.default_value.startsWith('nextval')
    ) {
      switch (type) {
        case ColumnType.SMALLINT:
          type = ColumnType.SMALLSERIAL;
          break;
        case ColumnType.INTEGER:
          type = ColumnType.SERIAL;
          break;
        case ColumnType.BIGINT:
          type = ColumnType.BIGSERIAL;
          break;
      }
    }

    let isPrimary = column.is_primary_key;

    // Determine if the column is a compositive primary key
    if (compositivePrimaryKeys.includes(column.name)) {
      isPrimary = true;
    }

    schema.columns[column.name] = {
      type,
      kind: 'column',
      isNullable: column.is_nullable,
      isUnique: column.is_unique,
      isPrimary,
    };
  }

  return sanitizeSchema(schema);
};
