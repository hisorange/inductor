import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';
import { readColumns } from './column.reader';
import { readCompositePrimaryKeys } from './composite-primary-key.reader';
import { readEnumerators } from './enumerator.reader';
import { readIndexes } from './index.reader';
import { readRelations } from './relation.reader';
import { readTableList } from './table.reader';
import { readTypes } from './type.reader';
import { readUniqueConstraints } from './unique-constraint.reader';
import { readUniques } from './unique.reader';

export const readDatabase = async (knex: Knex): Promise<IDatabaseState> => {
  const [
    tables,
    types,
    uniqueConstraints,
    relations,
    uniques,
    compositePrimaryKeys,
    indexes,
    columnValues,
    enumerators,
  ] = await Promise.all([
    readTableList(knex),
    readTypes(knex),
    readUniqueConstraints(knex),
    readRelations(knex),
    readUniques(knex),
    readCompositePrimaryKeys(knex),
    readIndexes(knex),
    readColumns(knex),
    readEnumerators(knex),
  ]);

  const tablesMeta = tables.reduce(
    (acc, [name, isLogged, comment]) => ({
      ...acc,
      [name]: {
        isLogged,
        comment,
      },
    }),
    {},
  ) as IDatabaseState['tablesMeta'];

  const state: IDatabaseState = {
    tables: tables.map(([table]) => table),
    unloggedTables: tables
      .filter(([_, isLogged]) => !isLogged)
      .map(([table]) => table),
    tablesMeta,
    types,
    uniques,
    relations,
    uniqueConstraints,
    tableRowChecks: new Map<string, boolean>(),
    compositePrimaryKeys,
    indexes,
    columnValues,
    enumerators,
  };

  return state;
};
