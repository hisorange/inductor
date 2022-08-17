import cloneDeep from 'lodash.clonedeep';
import { ColumnType, IndexType } from '../src';
import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { ColumnTools } from '../src/tools/column-tools';
import { createTestColumn, TestColumns } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Primary Constraint', () => {
  const driver = createTestDriver();
  const primaryColumns = cloneDeep(TestColumns);

  // Remove the non primary able columns
  for (const col in primaryColumns) {
    if (Object.prototype.hasOwnProperty.call(primaryColumns, col)) {
      if (!ColumnTools.canTypeBePrimary(primaryColumns[col])) {
        delete primaryColumns[col];
      }
    }
  }

  const testTables = Object.keys(primaryColumns);

  const clearTables = async () => {
    await driver.migrationManager.dropTable(`alter_primary_extend`);

    await Promise.all(
      testTables.map(name =>
        driver.migrationManager.dropTable(`create_primary_${name}`),
      ),
    );

    await Promise.all(
      testTables.map(name =>
        driver.migrationManager.dropTable(`alter_primary_${name}`),
      ),
    );
  };

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await driver.closeConnection();
  });

  test.each(testTables)(
    'should create the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `create_primary_${colName}`;
      const testBlueprint = initBlueprint(tableName);
      testBlueprint.columns = {
        [colName]: {
          ...primaryColumns[colName],
          isPrimary: true,
        },
      };
      await driver.setState([testBlueprint]);

      expect(testBlueprint).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );
    },
  );

  test.each(testTables.filter(t => !t.match(/serial/)))(
    'should alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;
      const blueprintRV1 = initBlueprint(tableName);
      blueprintRV1.columns = {
        prefix: {
          ...createTestColumn(ColumnType.INTEGER),
        },
        [colName]: TestColumns[colName],
        createdAt: {
          ...createTestColumn(ColumnType.DATE),
          isIndexed: IndexType.BRIN,
        },
      };

      blueprintRV1.columns[colName].isPrimary = false;
      await driver.setState([blueprintRV1]);

      expect(blueprintRV1).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      blueprintRV2.columns[colName].isPrimary = true;
      await driver.setState([blueprintRV2]);

      expect(blueprintRV2).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );

      const blueprintRV3 = cloneDeep(blueprintRV2);
      // Revert the nullable
      blueprintRV3.columns[colName].isPrimary = false;

      await driver.setState([blueprintRV3]);

      expect(blueprintRV3).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );
    },
    5_000,
  );

  test('should add/remove the primary keys', async () => {
    const tableName = 'alter_primary_extend';
    const blueprintRV1 = initBlueprint(tableName);
    blueprintRV1.columns = {
      first: {
        ...createTestColumn(ColumnType.INTEGER),
        isPrimary: true,
      },
    };
    await driver.setState([blueprintRV1]);

    expect(blueprintRV1).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );

    // Extend the primary
    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns.second = {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    };
    await driver.setState([blueprintRV2]);

    expect(blueprintRV2).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );

    // Add the third primary column
    const blueprintRV3 = cloneDeep(blueprintRV2);
    blueprintRV3.columns.third = {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    };
    await driver.setState([blueprintRV3]);

    expect(blueprintRV3).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );

    // Remove the third primary column
    const blueprintRV4 = cloneDeep(blueprintRV3);
    blueprintRV4.columns.third.isPrimary = false;
    await driver.setState([blueprintRV4]);

    expect(blueprintRV4).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );

    // Remove the second primary column
    const blueprintRV5 = cloneDeep(blueprintRV4);
    blueprintRV5.columns.second.isPrimary = false;
    await driver.setState([blueprintRV5]);

    expect(blueprintRV5).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );
  });
});
