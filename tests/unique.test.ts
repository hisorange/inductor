import cloneDeep from 'lodash.clonedeep';
import { ColumnType } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { ColumnTools } from '../src/tools/column-tools';
import { createTestColumn, TestColumns } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Unique Constraint', () => {
  const driver = createTestDriver();

  const uniqueCols = cloneDeep(TestColumns);

  // Remove the non primary able columns
  for (const col in uniqueCols) {
    if (Object.prototype.hasOwnProperty.call(uniqueCols, col)) {
      if (!ColumnTools.canTypeBeUnique(uniqueCols[col])) {
        delete uniqueCols[col];
      }
    }
  }

  const testTables = Object.keys(uniqueCols);
  const cleanup = async () => {
    await Promise.all([driver.migrator.dropTable(`unique_test_upgrade`)]);
    await Promise.all(
      testTables.map(name => driver.migrator.dropTable(`alter_unique_${name}`)),
    );
    await Promise.all(
      testTables.map(name =>
        driver.migrator.dropTable(`unique_test_comp_${name}`),
      ),
    );
  };

  afterAll(async () => {
    await cleanup();
    await driver.closeConnection();
  });

  test.each(testTables)(
    'should manipulate the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;
      const schemaRV1 = InitiateSchema(tableName);
      schemaRV1.columns = {
        id: {
          ...createTestColumn(ColumnType.INTEGER),
          isPrimary: true,
        },
        [colName]: uniqueCols[colName],
        createdAt: createTestColumn(ColumnType.DATE),
      };
      // Set unique to false
      schemaRV1.columns[colName].isUnique = false;
      await driver.setState([schemaRV1]);

      expect(schemaRV1).toStrictEqual((await driver.readState([tableName]))[0]);

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the unique
      schemaRV2.columns[colName].isUnique = true;
      await driver.setState([schemaRV2]);

      expect(schemaRV2).toStrictEqual((await driver.readState([tableName]))[0]);

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the unique
      schemaRV3.columns[colName].isUnique = false;

      await driver.setState([schemaRV3]);

      expect(schemaRV3).toStrictEqual((await driver.readState([tableName]))[0]);
    },
  );

  test.each(Object.keys(uniqueCols))(
    'should create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;
      const uniqueName = `unique_pair_${columnKey}`;

      const schema = InitiateSchema(tableName);
      schema.columns = {
        [columnKey]: uniqueCols[columnKey],
        pair_for_comp: {
          ...createTestColumn(ColumnType.BIGINT),
        },
      };

      // Ensure the column is not unique
      schema.columns[columnKey].isUnique = false;

      // Create the composite unique
      schema.uniques = {
        [uniqueName]: {
          columns: [columnKey, 'pair_for_comp'],
        },
      };
      await driver.setState([schema]);

      expect(schema).toStrictEqual((await driver.readState([tableName]))[0]);
    },
  );

  test('should alter between compound unique states', async () => {
    const tableName = 'unique_test_upgrade';
    const schemaRV1 = InitiateSchema(tableName);
    schemaRV1.columns = {
      col_1: {
        ...createTestColumn(ColumnType.INTEGER),
        isUnique: true,
      },
      col_2: createTestColumn(ColumnType.INTEGER),
    };
    await driver.setState([schemaRV1]);

    console.log('READ STATE', (await driver.readState([tableName]))[0]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(schemaRV1);

    // Set the second column as unique to convert the index into a composite one
    const schemaRV2 = cloneDeep(schemaRV1);
    schemaRV2.columns.col_1.isUnique = false;
    schemaRV2.uniques.test_cmp_1 = {
      columns: ['col_1', 'col_2'],
    };
    await driver.setState([schemaRV2]);

    expect(schemaRV2).toStrictEqual((await driver.readState([tableName]))[0]);

    // Create a new column and add it to the composite unique
    const schemaRV3 = cloneDeep(schemaRV2);
    schemaRV3.columns.col_3 = createTestColumn(ColumnType.INTEGER);
    schemaRV3.uniques.test_cmp_1.columns.push('col_3');
    await driver.setState([schemaRV3]);

    expect(schemaRV3).toStrictEqual((await driver.readState([tableName]))[0]);

    // Remove the composite unique
    const schemaRV4 = cloneDeep(schemaRV3);
    delete schemaRV4.uniques.test_cmp_1;
    await driver.setState([schemaRV4]);

    expect(schemaRV4).toStrictEqual((await driver.readState([tableName]))[0]);
  });
});
