import cloneDeep from 'lodash.clonedeep';
import { ColumnTools } from '../../src';
import { PostgresColumnType } from '../../src/interface/blueprint/postgres/postgres.column-type';
import { createBlueprint } from '../../src/util/create-blueprint';
import {
  createPostgresColumnWithType,
  PostgresAllColumn,
} from './util/all-column';
import { createPostgresDriver } from './util/create-connection';

describe('[Postgres] Unique Constraint', () => {
  const driver = createPostgresDriver();

  const uniqueCols = cloneDeep(PostgresAllColumn);

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
    await driver.close();
  });

  test.each(testTables)(
    'should manipulate the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;
      const blueprintRV1 = createBlueprint(tableName);
      blueprintRV1.columns = {
        id: {
          ...createPostgresColumnWithType(PostgresColumnType.INTEGER),
          isPrimary: true,
        },
        [colName]: uniqueCols[colName],
        createdAt: createPostgresColumnWithType(PostgresColumnType.DATE),
      };
      // Set unique to false
      blueprintRV1.columns[colName].isUnique = false;
      await driver.migrate([blueprintRV1]);

      expect(blueprintRV1).toStrictEqual(
        (await driver.reverse([tableName]))[0],
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      // Change the unique
      blueprintRV2.columns[colName].isUnique = true;
      await driver.migrate([blueprintRV2]);

      expect(blueprintRV2).toStrictEqual(
        (await driver.reverse([tableName]))[0],
      );

      const blueprintRV3 = cloneDeep(blueprintRV2);
      // Revert the unique
      blueprintRV3.columns[colName].isUnique = false;

      await driver.migrate([blueprintRV3]);

      expect(blueprintRV3).toStrictEqual(
        (await driver.reverse([tableName]))[0],
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
          ...createPostgresColumnWithType(PostgresColumnType.BIGINT),
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
      await driver.migrate([blueprint]);

      expect(blueprint).toStrictEqual((await driver.reverse([tableName]))[0]);
    },
  );

  test('should alter between compound unique states', async () => {
    const tableName = 'unique_test_upgrade';
    const blueprintRV1 = createBlueprint(tableName);
    blueprintRV1.columns = {
      col_1: {
        ...createPostgresColumnWithType(PostgresColumnType.INTEGER),
        isUnique: true,
      },
      col_2: createPostgresColumnWithType(PostgresColumnType.INTEGER),
    };
    await driver.migrate([blueprintRV1]);

    console.log('READ STATE', (await driver.reverse([tableName]))[0]);

    expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprintRV1);

    // Set the second column as unique to convert the index into a composite one
    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns.col_1.isUnique = false;
    blueprintRV2.uniques.test_cmp_1 = {
      columns: ['col_1', 'col_2'],
    };
    await driver.migrate([blueprintRV2]);

    expect(blueprintRV2).toStrictEqual((await driver.reverse([tableName]))[0]);

    // Create a new column and add it to the composite unique
    const blueprintRV3 = cloneDeep(blueprintRV2);
    blueprintRV3.columns.col_3 = createPostgresColumnWithType(
      PostgresColumnType.INTEGER,
    );
    blueprintRV3.uniques.test_cmp_1.columns.push('col_3');
    await driver.migrate([blueprintRV3]);

    expect(blueprintRV3).toStrictEqual((await driver.reverse([tableName]))[0]);

    // Remove the composite unique
    const blueprintRV4 = cloneDeep(blueprintRV3);
    delete blueprintRV4.uniques.test_cmp_1;
    await driver.migrate([blueprintRV4]);

    expect(blueprintRV4).toStrictEqual((await driver.reverse([tableName]))[0]);
  });
});
