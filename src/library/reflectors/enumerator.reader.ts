import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';

type Result = {
  table: string;
  type: string;
  value: string;
  column: string;
}[];

export const readEnumerators = async (
  knex: Knex,
): Promise<IDatabaseState['enumerators']> => {
  const result: Result = await knex({
    e: 'pg_enum',
  })
    .select({
      table: 'c.table_name',
      type: 't.typname',
      value: 'e.enumlabel',
      column: 'c.column_name',
    })
    .join(
      {
        t: 'pg_type',
      },
      {
        't.oid': 'e.enumtypid',
      },
    )
    .join(
      {
        c: 'information_schema.columns',
      },
      {
        't.typname': 'c.udt_name',
      },
    )
    .orderBy('e.enumsortorder', 'asc');

  const fact: IDatabaseState['enumerators'] = {};

  for (const row of result) {
    if (!fact.hasOwnProperty(row.table)) {
      fact[row.table] = {};
    }

    if (!fact[row.table].hasOwnProperty(row.column)) {
      fact[row.table][row.column] = {
        nativeType: row.type,
        values: [],
      };
    }

    fact[row.table][row.column].values.push(row.value);
  }

  return fact;
};
