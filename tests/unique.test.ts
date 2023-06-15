import cloneDeep from 'lodash.clonedeep';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { ColumnTools } from '../src/utils/column-tools';
import { createTestColumn, TestColumns } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Unique Constraint', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

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
    return;
    await Promise.all([driver.migrator.drop(`unique_test_upgrade`)]);
    await Promise.all(
      testTables.map(name => driver.migrator.drop(`alter_unique_${name}`)),
    );
    await Promise.all(
      testTables.map(name => driver.migrator.drop(`unique_test_comp_${name}`)),
    );
  };

  afterAll(async () => {
    await cleanup();
    await driver.close();
  });

  test.each(testTables)(
    'should manipulate the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;
      const tableRV1 = InitiateTable(tableName);
      tableRV1.columns = {
        id: {
          ...createTestColumn(ColumnType.INTEGER),
          isPrimary: true,
        },
        [colName]: uniqueCols[colName],
        createdAt: createTestColumn(ColumnType.DATE),
      };
      // Set unique to false
      tableRV1.columns[colName].isUnique = false;
      await toEqual(tableRV1);

      const tableRV2 = cloneDeep(tableRV1);
      // Change the unique
      tableRV2.columns[colName].isUnique = true;
      await toEqual(tableRV2);

      const tableRV3 = cloneDeep(tableRV2);
      // Revert the unique
      tableRV3.columns[colName].isUnique = false;
      await toEqual(tableRV3);
    },
  );

  test.each(Object.keys(uniqueCols))(
    'should create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;
      const uniqueName = `unique_pair_${columnKey}`;

      const table = InitiateTable(tableName);
      table.columns = {
        [columnKey]: uniqueCols[columnKey],
        pair_for_comp: {
          ...createTestColumn(ColumnType.BIGINT),
        },
      };

      // Ensure the column is not unique
      table.columns[columnKey].isUnique = false;

      // Create the composite unique
      table.uniques = {
        [uniqueName]: {
          columns: [columnKey, 'pair_for_comp'],
        },
      };
      await toEqual(table);
    },
  );

  test('should alter between compound unique states', async () => {
    const tableName = 'unique_test_upgrade';
    const tableRV1 = InitiateTable(tableName);
    tableRV1.columns = {
      col_1: {
        ...createTestColumn(ColumnType.INTEGER),
        isUnique: true,
      },
      col_2: createTestColumn(ColumnType.INTEGER),
    };
    await toEqual(tableRV1);

    // Set the second column as unique to convert the index into a composite one
    const tableRV2 = cloneDeep(tableRV1);
    tableRV2.columns.col_1.isUnique = false;
    tableRV2.uniques!.test_cmp_1 = {
      columns: ['col_1', 'col_2'],
    };
    await toEqual(tableRV2);

    // Create a new column and add it to the composite unique
    const tableRV3 = cloneDeep(tableRV2);
    tableRV3.columns.col_3 = createTestColumn(ColumnType.INTEGER);
    tableRV3.uniques!.test_cmp_1.columns.push('col_3');
    await toEqual(tableRV3);

    // Remove the composite unique
    const tableRV4 = cloneDeep(tableRV3);
    delete tableRV4.uniques!.test_cmp_1;
    await toEqual(tableRV4);
  });
});
