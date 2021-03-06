import { Knex } from 'knex';

/**
 * Alter the columns' nullable status
 */
export const alterNullable = (
  builder: Knex.CreateTableBuilder,
  columnName: string,
  isNullable: boolean,
) => {
  if (isNullable) {
    builder.setNullable(columnName);
  } else {
    builder.dropNullable(columnName);
  }
};

/**
 * Alter the columns' unique status
 */
export const alterUnique = (
  builder: Knex.CreateTableBuilder,
  columnName: string,
  isUnique: boolean,
) => {
  if (isUnique) {
    builder.unique([columnName]);
  } else {
    builder.dropUnique([columnName]);
  }
};
