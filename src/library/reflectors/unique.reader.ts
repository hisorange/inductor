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

  const uniques: {
    tableName: string;
    uniqueName: string;
    columnName: string;
  }[] = await query;

  for (const unique of uniques) {
    if (!state.hasOwnProperty(unique.tableName)) {
      state[unique.tableName] = {};
    }

    const tableRef = state[unique.tableName];

    if (
      typeof tableRef === 'object' &&
      !tableRef.hasOwnProperty(unique.uniqueName)
    ) {
      tableRef[unique.uniqueName] = {
        columns: [unique.columnName],
      };
    } else {
      tableRef![unique.uniqueName].columns.push(unique.columnName);
    }
  }

  return state;
};
