import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';

export const readCompositePrimaryKeys = async (
  knex: Knex,
): Promise<IDatabaseState['compositePrimaryKeys']> => {
  const query = knex({
    tc: 'information_schema.table_constraints',
  })
    .select({
      tableName: 'tc.table_name',
      contraintName: 'tc.constraint_name',
      columnName: 'kcu.column_name',
    })
    .join(
      { kcu: 'information_schema.key_column_usage' },
      {
        'tc.table_schema': 'kcu.table_schema',
        'tc.table_name': 'kcu.table_name',
        'tc.constraint_name': 'kcu.constraint_name',
      },
    )
    .where({
      'tc.constraint_type': 'PRIMARY KEY',
      'tc.table_schema': knex.raw('current_schema()'),
    });

  const fact: IDatabaseState['compositePrimaryKeys'] = {};

  for (const row of await query) {
    if (!fact.hasOwnProperty(row.tableName)) {
      fact[row.tableName] = [];
    }

    fact[row.tableName].push(row.columnName);
  }

  return fact;
};
