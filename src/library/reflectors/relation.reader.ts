import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';
import { ForeignAction } from '../../types/foreign-action.enum';
import { decodeRelationMeta } from '../../utils/meta.coder';

export const readRelations = async (
  knex: Knex,
): Promise<IDatabaseState['relations']> => {
  const state: IDatabaseState['relations'] = {};

  const query = knex({
    fks: 'information_schema.table_constraints',
  })
    .select({
      // Table where the foreign key is defined
      localTableName: 'fks.table_name',
      // Foreign constrain's name
      relationName: 'fks.constraint_name',
      // Foreign key's column
      localColumnName: 'kcu_foreign.column_name',
      // Remote primary key's constraint name
      remotePrimaryKeyConstraint: 'rc.unique_constraint_name',
      // Remote table
      remoteTableName: 'pks.table_name',
      // Target column's name
      remoteColumnName: 'kcu_primary.column_name',
      updateRule: 'rc.update_rule',
      deleteRule: 'rc.delete_rule',
      // Important for composite remote keys, where the order matters
      ordinalPosition: 'kcu_foreign.ordinal_position',
      // Comment for the constraint
      comment: 'd.description',
    })
    .innerJoin(
      { kcu_foreign: 'information_schema.key_column_usage' },
      {
        'fks.table_catalog': 'kcu_foreign.table_catalog',
        'fks.table_schema': 'kcu_foreign.table_schema',
        'fks.table_name': 'kcu_foreign.table_name',
        'fks.constraint_name': 'kcu_foreign.constraint_name',
      },
    )
    .innerJoin(
      { rc: 'information_schema.referential_constraints' },
      {
        'rc.constraint_catalog': 'fks.table_catalog',
        'rc.constraint_schema': 'fks.constraint_schema',
        'rc.constraint_name': 'fks.constraint_name',
      },
    )
    .innerJoin(
      { pks: 'information_schema.table_constraints' },
      {
        'rc.unique_constraint_catalog': 'pks.constraint_catalog',
        'rc.unique_constraint_schema': 'pks.constraint_schema',
        'rc.unique_constraint_name': 'pks.constraint_name',
      },
    )
    .innerJoin(
      {
        kcu_primary: 'information_schema.key_column_usage',
      },
      {
        'pks.table_catalog': 'kcu_primary.table_catalog',
        'pks.table_schema': 'kcu_primary.table_schema',
        'pks.table_name': 'kcu_primary.table_name',
        'pks.constraint_name': 'kcu_primary.constraint_name',
        'kcu_foreign.ordinal_position': 'kcu_primary.ordinal_position',
      },
    )
    .innerJoin(
      {
        co: 'pg_catalog.pg_constraint',
      },
      {
        'co.conname': 'fks.constraint_name',
        'co.contype': knex.raw("'f'"),
      },
    )
    .leftJoin(
      {
        d: 'pg_catalog.pg_description',
      },
      {
        'd.objoid': 'co.oid',
        'co.tableoid': 'd.classoid',
      },
    )
    .where({
      'fks.constraint_type': 'FOREIGN KEY',
      'pks.constraint_type': 'PRIMARY KEY',
      'fks.table_schema': knex.raw('current_schema()'),
    })
    .orderBy('fks.constraint_name')
    .orderBy('kcu_foreign.ordinal_position');

  // console.log(query.toQuery());

  const rows: {
    localTableName: string;
    relationName: string;
    localColumnName: string;
    remotePrimaryKeyConstraint: string;
    remoteTableName: string;
    remoteColumnName: string;
    updateRule: ForeignAction;
    deleteRule: ForeignAction;
    ordinalPosition: number;
    comment?: string;
  }[] = await query;

  for (const row of rows) {
    // Create the table key
    if (!state.hasOwnProperty(row.localTableName)) {
      state[row.localTableName] = {};
    }

    const tableRef = state[row.localTableName];

    // Create the contraint key
    if (!tableRef.hasOwnProperty(row.relationName)) {
      const relation = {
        columns: [row.localColumnName],
        references: {
          table: row.remoteTableName,
          columns: [row.remoteColumnName],
        },
        isLocalUnique: true,
        onDelete: row.deleteRule.toLowerCase() as ForeignAction,
        onUpdate: row.updateRule.toLowerCase() as ForeignAction,
      };

      if (row.comment) {
        decodeRelationMeta(relation, row.comment);
      }

      tableRef[row.relationName] = relation;
    }
    // Add the new column
    else {
      tableRef[row.relationName].columns.push(row.localColumnName);
      tableRef[row.relationName].references.columns.push(row.remoteColumnName);
    }
  }

  return state;
};
