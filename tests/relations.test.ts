import { ColumnType, ForeignAction } from '../src';
import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Relations', () => {
  const driver = createTestDriver();

  afterAll(() => driver.closeConnection());

  test('should create a belongs to relation', async () => {
    const tableNameA = `relation_belongsto_a`;
    const tableNameB = `relation_belongsto_b`;

    const blueprintA = initBlueprint(tableNameA);
    blueprintA.columns = {
      a_id_1: {
        ...createTestColumn(ColumnType.UUID),
        isPrimary: true,
      },
      a_id_2: {
        ...createTestColumn(ColumnType.TEXT),
        isPrimary: true,
      },
    };

    const blueprintB = initBlueprint(tableNameB);
    blueprintB.relations = {
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

    blueprintB.columns = {
      b_id_1: {
        ...createTestColumn(ColumnType.UUID),
        isPrimary: true,
      },
      b_id_2: {
        ...createTestColumn(ColumnType.TEXT),
        isPrimary: true,
      },
    };

    // Remove blueprint if exists from a previous test
    await driver.migrationManager.dropBlueprint(blueprintB);
    await driver.migrationManager.dropBlueprint(blueprintA);

    // Apply the new state
    await driver.setState([blueprintA, blueprintB]);

    expect(blueprintA).toStrictEqual((await driver.readState([tableNameA]))[0]);
    expect(blueprintB).toStrictEqual((await driver.readState([tableNameB]))[0]);

    // Cleanup
    await driver.migrationManager.dropBlueprint(blueprintB);
    await driver.migrationManager.dropBlueprint(blueprintA);
  });
});
