import cloneDeep from 'lodash.clonedeep';
import { ColumnType, IndexType } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
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
      const testSchema = InitiateSchema(tableName);
      testSchema.columns = {
        [colName]: {
          ...primaryColumns[colName],
          isPrimary: true,
        },
      };
      await driver.setState([testSchema]);

      expect(testSchema).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );
    },
  );

  test.each(testTables.filter(t => !t.match(/serial/)))(
    'should alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;
      const schemaRV1 = InitiateSchema(tableName);
      schemaRV1.columns = {
        prefix: {
          ...createTestColumn(ColumnType.INTEGER),
        },
        [colName]: TestColumns[colName],
        createdAt: {
          ...createTestColumn(ColumnType.DATE),
          isIndexed: IndexType.BRIN,
        },
      };

      schemaRV1.columns[colName].isPrimary = false;
      await driver.setState([schemaRV1]);

      expect(schemaRV1).toStrictEqual((await driver.readState([tableName]))[0]);

      const schemaRV2 = cloneDeep(schemaRV1);
      schemaRV2.columns[colName].isPrimary = true;
      await driver.setState([schemaRV2]);

      expect(schemaRV2).toStrictEqual((await driver.readState([tableName]))[0]);

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isPrimary = false;

      await driver.setState([schemaRV3]);

      expect(schemaRV3).toStrictEqual((await driver.readState([tableName]))[0]);
    },
    5_000,
  );

  test('should add/remove the primary keys', async () => {
    const tableName = 'alter_primary_extend';
    const schemaRV1 = InitiateSchema(tableName);
    schemaRV1.columns = {
      first: {
        ...createTestColumn(ColumnType.INTEGER),
        isPrimary: true,
      },
    };
    await driver.setState([schemaRV1]);

    expect(schemaRV1).toStrictEqual((await driver.readState([tableName]))[0]);

    // Extend the primary
    const schemaRV2 = cloneDeep(schemaRV1);
    schemaRV2.columns.second = {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    };
    await driver.setState([schemaRV2]);

    expect(schemaRV2).toStrictEqual((await driver.readState([tableName]))[0]);

    // Add the third primary column
    const schemaRV3 = cloneDeep(schemaRV2);
    schemaRV3.columns.third = {
      ...createTestColumn(ColumnType.INTEGER),
      isPrimary: true,
    };
    await driver.setState([schemaRV3]);

    expect(schemaRV3).toStrictEqual((await driver.readState([tableName]))[0]);

    // Remove the third primary column
    const schemaRV4 = cloneDeep(schemaRV3);
    schemaRV4.columns.third.isPrimary = false;
    await driver.setState([schemaRV4]);

    expect(schemaRV4).toStrictEqual((await driver.readState([tableName]))[0]);

    // Remove the second primary column
    const schemaRV5 = cloneDeep(schemaRV4);
    schemaRV5.columns.second.isPrimary = false;
    await driver.setState([schemaRV5]);

    expect(schemaRV5).toStrictEqual((await driver.readState([tableName]))[0]);
  });
});
