import { ColumnType } from '../enum/column-type.enum';
import { Inspector } from '../inspector';
import { ISchema } from '../interface/schema.interface';
import { sanitizeSchema } from '../util/sanitize.schema';

export const reverseTable = async (inspector: Inspector, table: string) => {
  const schema: ISchema = {
    name: table,
    kind: 'table',
    columns: {},
    uniques: {},
    indexes: {},
  };
  const columns = await inspector.columnInfo(table);
  const compositivePrimaryKeys = await inspector.getCompositePrimaryKeys(table);
  const compositiveUniques = await inspector.getCompositeUniques(table);

  // Merge compositive uniques into the schema, but remove the table prefix from the name
  for (const [name, uniques] of Object.entries(compositiveUniques)) {
    const unprefixedName = name.replace(`${table}_`, '');
    schema.uniques[unprefixedName] = uniques;
  }

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
