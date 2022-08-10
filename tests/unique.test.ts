import cloneDeep from 'lodash.clonedeep';
import { ColumnTools } from '../src';
import { PostgresColumnType } from '../src/interface/schema/postgres/postgres.column-type';
import { createSchema } from '../src/util/create-schema';
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
      inductor.driver.connection.schema.dropTableIfExists(
        `unique_test_upgrade`,
      ),
    ]);

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(
          `unique_test_${name}`,
        ),
      ),
    );

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(
          `alter_unique_${name}`,
        ),
      ),
    );

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(
          `unique_test_comp_${name}`,
        ),
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

      const schema = createSchema(tableName);
      schema.columns = {
        [columnKey]: uniqueCols[columnKey],
      };
      // Set the column to unique
      schema.columns[columnKey].isUnique = true;

      // Apply the statement
      await inductor.setState([schema]);

      expect(schema).toStrictEqual((await inductor.readState([tableName]))[0]);
    },
  );

  test.each(testTables)(
    'should alter the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;
      const schemaRV1 = createSchema(tableName);
      schemaRV1.columns = {
        id: {
          ...createColumnWithType(PostgresColumnType.INTEGER),
          isPrimary: true,
        },
        [colName]: uniqueCols[colName],
        createdAt: createColumnWithType(PostgresColumnType.DATE),
      };
      // Set nullable to false
      schemaRV1.columns[colName].isUnique = false;
      await inductor.setState([schemaRV1]);

      expect(schemaRV1).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the nullable
      schemaRV2.columns[colName].isUnique = true;
      await inductor.setState([schemaRV2]);

      expect(schemaRV2).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isUnique = false;

      await inductor.setState([schemaRV3]);

      expect(schemaRV3).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
  );

  test.each(Object.keys(uniqueCols))(
    'should create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;
      const uniqueName = `unique_pair_${columnKey}`;

      const schema = createSchema(tableName);
      schema.columns = {
        [columnKey]: uniqueCols[columnKey],
        pair_for_comp: {
          ...createColumnWithType(PostgresColumnType.BIGINT),
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
      await inductor.setState([schema]);

      expect(schema).toStrictEqual((await inductor.readState([tableName]))[0]);
    },
  );

  test('should alter between compound unique states', async () => {
    const tableName = 'unique_test_upgrade';
    const schema = createSchema(tableName);
    schema.columns = {
      col_1: {
        ...createColumnWithType(PostgresColumnType.INTEGER),
        isUnique: true,
      },
      col_2: createColumnWithType(PostgresColumnType.INTEGER),
    };
    await inductor.setState([schema]);

    expect(schema).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Set the second column as unique to convert the index into a compositive one
    schema.columns.col_1.isUnique = false;
    schema.uniques.test_cmp_1 = {
      columns: ['col_1', 'col_2'],
    };
    await inductor.setState([schema]);

    expect(schema).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Create a new column and add it to the composite unique
    schema.columns.col_3 = createColumnWithType(PostgresColumnType.INTEGER);
    schema.uniques.test_cmp_1.columns.push('col_3');
    await inductor.setState([schema]);

    expect(schema).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Remove the composite unique
    delete schema.uniques.test_cmp_1;
    await inductor.setState([schema]);

    expect(schema).toStrictEqual((await inductor.readState([tableName]))[0]);
  });
});
