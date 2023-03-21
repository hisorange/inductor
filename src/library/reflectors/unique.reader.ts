import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';

export const readUniques = async (
  knex: Knex,
): Promise<IDatabaseState['uniques']> => {
  const state: IDatabaseState['uniques'] = {};

  const query = knex({
    tc: 'information_schema.table_constraints',
  })
    .select({
      tableName: 'tc.table_name',
      uniqueName: 'tc.constraint_name',
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
      'tc.constraint_type': 'UNIQUE',
      'tc.table_schema': knex.raw('current_schema()'),
      //'tc.table_name': tableName,
    });

  const rows = await query;

  for (const row of rows) {
    if (!state.hasOwnProperty(row.tableName)) {
      state[row.tableName] = {};
    }

    const tableRef = state[row.tableName];

    if (!tableRef.hasOwnProperty(row.uniqueName)) {
      tableRef[row.uniqueName] = {
        columns: [row.columnName],
      };
    } else {
      tableRef[row.uniqueName].columns.push(row.columnName);
    }
  }

  return state;
};
