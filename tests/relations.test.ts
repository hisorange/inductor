import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { ForeignAction } from '../src/types/foreign-action.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Relations', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const tableA = InitiateTable(tableNameA);
    tableA.columns = {
      a_id_1: {
        ...createTestColumn(ColumnType.UUID),
        isPrimary: true,
      },
      a_id_2: {
        ...createTestColumn(ColumnType.TEXT),
        isPrimary: true,
      },
    };

    const tableB = InitiateTable(tableNameB);
    tableB.relations = {
      belongs_to_a: {
        columns: ['b_id_1', 'b_id_2'],
        references: {
          table: tableNameA,
          columns: ['a_id_1', 'a_id_2'],
        },
        isLocalUnique: true,
        onDelete: ForeignAction.SET_NULL,
        onUpdate: ForeignAction.CASCADE,
        alias: 'baa',
      },
    };

    tableB.columns = {
      b_id_1: {
        ...createTestColumn(ColumnType.UUID),
        isPrimary: true,
      },
      b_id_2: {
        ...createTestColumn(ColumnType.TEXT),
        isPrimary: true,
      },
    };

    // Remove table if exists from a previous test
    await driver.migrator.drop(tableB.name);
    await driver.migrator.drop(tableA.name);

    // Apply the new state
    await driver.set([tableA, tableB]);

    expect(tableA).toStrictEqual((await driver.read([tableNameA]))[0]);
    expect(tableB).toStrictEqual((await driver.read([tableNameB]))[0]);

    // Cleanup
    await driver.migrator.drop(tableB.name);
    await driver.migrator.drop(tableA.name);
  });
});
