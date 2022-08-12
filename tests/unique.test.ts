import cloneDeep from 'lodash.clonedeep';
import { ColumnTools } from '../src';
import { PostgresColumnType } from '../src/interface/blueprint/postgres/postgres.column-type';
import { createBlueprint } from '../src/util/create-blueprint';
import { allColumn, createColumnWithType } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Unique Constraint', () => {
  const inductor = createTestInstance();

  const uniqueCols = cloneDeep(allColumn);

  // Remove the non primary able columns
  for (const col in uniqueCols) {
    if (Object.prototype.hasOwnProperty.call(uniqueCols, col)) {
      if (!ColumnTools.postgres.canTypeBeUnique(uniqueCols[col])) {
        delete uniqueCols[col];
      }
    }
  }

  const testTables = Object.keys(uniqueCols);
  const cleanup = async () => {
    await Promise.all([
      inductor.driver.migrator.dropTable(`unique_test_upgrade`),
    ]);

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.migrator.dropTable(`unique_test_${name}`),
      ),
    );

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.migrator.dropTable(`alter_unique_${name}`),
      ),
    );

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.migrator.dropTable(`unique_test_comp_${name}`),
      ),
    );
  };

  beforeAll(() => cleanup());

  afterAll(async () => {
    await cleanup();
    await inductor.close();
  });

  test.each(Object.keys(uniqueCols))(
    'should create simple unique on [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_${columnKey}`;

      const blueprint = createBlueprint(tableName);
      blueprint.columns = {
        [columnKey]: uniqueCols[columnKey],
      };
      // Set the column to unique
      blueprint.columns[columnKey].isUnique = true;

      // Apply the statement
      await inductor.setState([blueprint]);

      expect(blueprint).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
  );

  test.each(testTables)(
    'should alter the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;
      const blueprintRV1 = createBlueprint(tableName);
      blueprintRV1.columns = {
        id: {
          ...createColumnWithType(PostgresColumnType.INTEGER),
          isPrimary: true,
        },
        [colName]: uniqueCols[colName],
        createdAt: createColumnWithType(PostgresColumnType.DATE),
      };
      // Set nullable to false
      blueprintRV1.columns[colName].isUnique = false;
      await inductor.setState([blueprintRV1]);

      expect(blueprintRV1).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      // Change the nullable
      blueprintRV2.columns[colName].isUnique = true;
      await inductor.setState([blueprintRV2]);

      expect(blueprintRV2).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const blueprintRV3 = cloneDeep(blueprintRV2);
      // Revert the nullable
      blueprintRV3.columns[colName].isUnique = false;

      await inductor.setState([blueprintRV3]);

      expect(blueprintRV3).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
  );

  test.each(Object.keys(uniqueCols))(
    'should create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;
      const uniqueName = `unique_pair_${columnKey}`;

      const blueprint = createBlueprint(tableName);
      blueprint.columns = {
        [columnKey]: uniqueCols[columnKey],
        pair_for_comp: {
          ...createColumnWithType(PostgresColumnType.BIGINT),
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
      await inductor.setState([blueprint]);

      expect(blueprint).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
  );

  test('should alter between compound unique states', async () => {
    const tableName = 'unique_test_upgrade';
    const blueprint = createBlueprint(tableName);
    blueprint.columns = {
      col_1: {
        ...createColumnWithType(PostgresColumnType.INTEGER),
        isUnique: true,
      },
      col_2: createColumnWithType(PostgresColumnType.INTEGER),
    };
    await inductor.setState([blueprint]);

    expect(blueprint).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Set the second column as unique to convert the index into a compositive one
    blueprint.columns.col_1.isUnique = false;
    blueprint.uniques.test_cmp_1 = {
      columns: ['col_1', 'col_2'],
    };
    await inductor.setState([blueprint]);

    expect(blueprint).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Create a new column and add it to the composite unique
    blueprint.columns.col_3 = createColumnWithType(PostgresColumnType.INTEGER);
    blueprint.uniques.test_cmp_1.columns.push('col_3');
    await inductor.setState([blueprint]);

    expect(blueprint).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Remove the composite unique
    delete blueprint.uniques.test_cmp_1;
    await inductor.setState([blueprint]);

    expect(blueprint).toStrictEqual((await inductor.readState([tableName]))[0]);
  });
});
