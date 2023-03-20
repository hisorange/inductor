import cloneDeep from 'lodash.clonedeep';
import { ColumnType, IndexType } from '../src';
import { InitiateTable } from '../src/table/initiator';
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
    await driver.migrator.dropTable(`alter_primary_extend`);

    await Promise.all(
      testTables.map(name =>
        driver.migrator.dropTable(`create_primary_${name}`),
      ),
    );

    await Promise.all(
      testTables.map(name =>
        driver.migrator.dropTable(`alter_primary_${name}`),
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
      const testTable = InitiateTable(tableName);
      testTable.columns = {
        [colName]: {
          ...primaryColumns[colName],
          isPrimary: true,
        },
      };
      await driver.setState([testTable]);

      expect(testTable).toStrictEqual((await driver.readState([tableName]))[0]);
    },
  );

  test.each(testTables.filter(t => !t.match(/serial/)))(
    'should alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;
      const tableRV1 = InitiateTable(tableName);
      tableRV1.columns = {
        prefix: {
          ...createTestColumn(ColumnType.INTEGER),
        },
        [colName]: TestColumns[colName],
        createdAt: {
          ...createTestColumn(ColumnType.DATE),
          isIndexed: IndexType.BRIN,
        },
      };

      tableRV1.columns[colName].isPrimary = false;
      await driver.setState([tableRV1]);

      expect(tableRV1).toStrictEqual((await driver.readState([tableName]))[0]);

      const tableRV2 = cloneDeep(tableRV1);
      tableRV2.columns[colName].isPrimary = true;
      await driver.setState([tableRV2]);

      expect(tableRV2).toStrictEqual((await driver.readState([tableName]))[0]);

      const tableRV3 = cloneDeep(tableRV2);
      // Revert the nullable
      tableRV3.columns[colName].isPrimary = false;

      await driver.setState([tableRV3]);

      expect(tableRV3).toStrictEqual((await driver.readState([tableName]))[0]);
    },
    5_000,
  );

  test('should add/remove the primary keys', async () => {
    const tableName = 'alter_primary_extend';
    const tableRV1 = InitiateTable(tableName);
    tableRV1.columns = {
      first: {
        ...createTestColumn(ColumnType.INTEGER),
        isPrimary: true,
      },
    };
    await driver.setState([tableRV1]);

    expect(tableRV1).toStrictEqual((await driver.readState([tableName]))[0]);

    // Extend the primary
    const tableRV2 = cloneDeep(tableRV1);
    tableRV2.columns.second = {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    };
    await driver.setState([tableRV2]);

    expect(tableRV2).toStrictEqual((await driver.readState([tableName]))[0]);

    // Add the third primary column
    const tableRV3 = cloneDeep(tableRV2);
    tableRV3.columns.third = {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    };
    await driver.setState([tableRV3]);

    expect(tableRV3).toStrictEqual((await driver.readState([tableName]))[0]);

    // Remove the third primary column
    const tableRV4 = cloneDeep(tableRV3);
    tableRV4.columns.third.isPrimary = false;
    await driver.setState([tableRV4]);

    expect(tableRV4).toStrictEqual((await driver.readState([tableName]))[0]);

    // Remove the second primary column
    const tableRV5 = cloneDeep(tableRV4);
    tableRV5.columns.second.isPrimary = false;
    await driver.setState([tableRV5]);

    expect(tableRV5).toStrictEqual((await driver.readState([tableName]))[0]);
  });
});
