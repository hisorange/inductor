import { ColumnType, ForeignAction } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Relations', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const schemaA = InitiateSchema(tableNameA);
    schemaA.columns = {
      a_id_1: {
        ...createTestColumn(ColumnType.UUID),
        isPrimary: true,
      },
      a_id_2: {
        ...createTestColumn(ColumnType.TEXT),
        isPrimary: true,
      },
    };

    const schemaB = InitiateSchema(tableNameB);
    schemaB.relations = {
      belongs_to_a: {
        columns: ['b_id_1', 'b_id_2'],
        references: {
          table: tableNameA,
          columns: ['a_id_1', 'a_id_2'],
        },
        isLocalUnique: true,
        onDelete: ForeignAction.SET_NULL,
        onUpdate: ForeignAction.CASCADE,
      },
    };

    schemaB.columns = {
      b_id_1: {
        ...createTestColumn(ColumnType.UUID),
        isPrimary: true,
      },
      b_id_2: {
        ...createTestColumn(ColumnType.TEXT),
        isPrimary: true,
      },
    };

    // Remove schema if exists from a previous test
    await driver.migrator.dropSchema(schemaB);
    await driver.migrator.dropSchema(schemaA);

    // Apply the new state
    await driver.setState([schemaA, schemaB]);

    expect(schemaA).toStrictEqual((await driver.readState([tableNameA]))[0]);
    expect(schemaB).toStrictEqual((await driver.readState([tableNameB]))[0]);

    // Cleanup
    await driver.migrator.dropSchema(schemaB);
    await driver.migrator.dropSchema(schemaA);
  });
});
