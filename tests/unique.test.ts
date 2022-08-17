import cloneDeep from 'lodash.clonedeep';
import { ColumnType } from '../src';
import { initBlueprint } from '../src/blueprint/blueprint.initiator';
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
    await Promise.all([
      driver.migrationManager.dropTable(`unique_test_upgrade`),
    ]);
    await Promise.all(
      testTables.map(name =>
        driver.migrationManager.dropTable(`alter_unique_${name}`),
      ),
    );
    await Promise.all(
      testTables.map(name =>
        driver.migrationManager.dropTable(`unique_test_comp_${name}`),
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
      const blueprintRV1 = initBlueprint(tableName);
      blueprintRV1.columns = {
        id: {
          ...createTestColumn(ColumnType.INTEGER),
          isPrimary: true,
        },
        [colName]: uniqueCols[colName],
        createdAt: createTestColumn(ColumnType.DATE),
      };
      // Set unique to false
      blueprintRV1.columns[colName].isUnique = false;
      await driver.setState([blueprintRV1]);

      expect(blueprintRV1).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      // Change the unique
      blueprintRV2.columns[colName].isUnique = true;
      await driver.setState([blueprintRV2]);

      expect(blueprintRV2).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );

      const blueprintRV3 = cloneDeep(blueprintRV2);
      // Revert the unique
      blueprintRV3.columns[colName].isUnique = false;

      await driver.setState([blueprintRV3]);

      expect(blueprintRV3).toStrictEqual(
        (await driver.readState([tableName]))[0],
      );
    },
  );

  test.each(Object.keys(uniqueCols))(
    'should create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;
      const uniqueName = `unique_pair_${columnKey}`;

      const blueprint = initBlueprint(tableName);
      blueprint.columns = {
        [columnKey]: uniqueCols[columnKey],
        pair_for_comp: {
          ...createTestColumn(ColumnType.BIGINT),
        },
      };

      // Ensure the column is not unique
      blueprint.columns[columnKey].isUnique = false;

      // Create the composite unique
      blueprint.uniques = {
        [uniqueName]: {
          columns: [columnKey, 'pair_for_comp'],
        },
      };
      await driver.setState([blueprint]);

      expect(blueprint).toStrictEqual((await driver.readState([tableName]))[0]);
    },
  );

  test('should alter between compound unique states', async () => {
    const tableName = 'unique_test_upgrade';
    const blueprintRV1 = initBlueprint(tableName);
    blueprintRV1.columns = {
      col_1: {
        ...createTestColumn(ColumnType.INTEGER),
        isUnique: true,
      },
      col_2: createTestColumn(ColumnType.INTEGER),
    };
    await driver.setState([blueprintRV1]);

    console.log('READ STATE', (await driver.readState([tableName]))[0]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    // Set the second column as unique to convert the index into a composite one
    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns.col_1.isUnique = false;
    blueprintRV2.uniques.test_cmp_1 = {
      columns: ['col_1', 'col_2'],
    };
    await driver.setState([blueprintRV2]);

    expect(blueprintRV2).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );

    // Create a new column and add it to the composite unique
    const blueprintRV3 = cloneDeep(blueprintRV2);
    blueprintRV3.columns.col_3 = createTestColumn(ColumnType.INTEGER);
    blueprintRV3.uniques.test_cmp_1.columns.push('col_3');
    await driver.setState([blueprintRV3]);

    expect(blueprintRV3).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );

    // Remove the composite unique
    const blueprintRV4 = cloneDeep(blueprintRV3);
    delete blueprintRV4.uniques.test_cmp_1;
    await driver.setState([blueprintRV4]);

    expect(blueprintRV4).toStrictEqual(
      (await driver.readState([tableName]))[0],
    );
  });
});
