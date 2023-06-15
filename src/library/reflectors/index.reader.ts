import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';

export const readIndexes = async (
  knex: Knex,
): Promise<IDatabaseState['indexes']> => {
  const query = knex({
    f: 'pg_attribute',
  })
    .select({
      schema: 'n.nspname',
      table: 'c.relname',
      column: 'f.attname',
      idx_name: 'i.relname',
      idx_type: 'am.amname',
    })
    .join(
      { c: 'pg_class' },
      {
        'c.oid': 'f.attrelid',
      },
    )
    .leftJoin({ n: 'pg_namespace' }, { 'n.oid': 'c.relnamespace' })
    .leftJoin(
      { p: 'pg_constraint' },
      { 'p.conrelid': 'c.oid', 'f.attnum': knex.raw('ANY(p.conkey)') },
    )
    .leftJoin(
      { ix: 'pg_index' },
      {
        'f.attnum': knex.raw('ANY(ix.indkey)'),
        'c.oid': 'f.attrelid',
        'ix.indrelid': 'c.oid',
      },
    )
    .leftJoin({ i: 'pg_class' }, { 'ix.indexrelid': 'i.oid' })
    .leftJoin({ am: 'pg_am' }, { 'am.oid': 'i.relam' })
    .where({
      'c.relkind': 'r',
      'n.nspname': knex.raw('current_schema()'),
      //'c.relname': tableName,
    })
    .whereNot({
      'i.oid': 0,
    })
    .whereNull('p.contype')
    .orderBy('f.attnum', 'asc');

  const rows = await query;
  const fact: IDatabaseState['indexes'] = {};

  for (const row of rows) {
    if (!fact.hasOwnProperty(row.table)) {
      fact[row.table] = {};
    }

    if (!fact[row.table]!.hasOwnProperty(row.idx_name)) {
      fact[row.table]![row.idx_name] = {
        columns: [],
        type: row.idx_type,
      };
    }

    fact[row.table]![row.idx_name].columns.push(row.column);
  }

  return fact;
};
