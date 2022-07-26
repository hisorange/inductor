import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../src/driver/postgres/postgres.column-type';
import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Unique Constraint', () => {
  let inductor: Inductor;

  const testTables = Object.keys(allColumn);
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

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await inductor.close();
  });

  test.each(Object.keys(allColumn))(
    'should be able to create simple unique on [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_${columnKey}`;

      const schema: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          [columnKey]: allColumn[columnKey],
        },
      };
      // Set the column to unique
      schema.columns[columnKey].isUnique = true;

      try {
        inductor.driver.validateSchema(schema);
      } catch (error) {
        return;
      }

      // Apply the statement
      await inductor.setState([schema]);

      expect(
        await inductor.driver.connection.schema.hasTable(tableName),
      ).toBeTruthy();
      expect(
        (
          await inductor.driver.migrator.inspector.columnInfo(
            tableName,
            columnKey,
          )
        ).is_unique,
      ).toBe(schema.columns[columnKey].isUnique);
    },
  );

  test.each(testTables)(
    'should be able to alter the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          id: {
            kind: 'column',
            type: PostgresColumnType.INTEGER,
            isNullable: false,
            isUnique: false,
            isPrimary: true,
            isIndexed: false,
          },
          [colName]: allColumn[colName],
          createdAt: {
            kind: 'column',
            type: PostgresColumnType.DATE,
            isNullable: false,
            isUnique: false,
            isPrimary: false,
            isIndexed: false,
          },
        },
      };
      // Set nullable to false
      schemaRV1.columns[colName].isUnique = false;

      try {
        inductor.driver.validateSchema(schemaRV1);
      } catch (error) {
        return;
      }

      // Apply the state
      await inductor.setState([schemaRV1]);

      const columnRV1 = await inductor.driver.migrator.inspector.columnInfo(
        tableName,
        colName,
      );
      expect(columnRV1.is_unique).toBeFalsy();

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the nullable
      schemaRV2.columns[colName].isUnique = true;

      try {
        inductor.driver.validateSchema(schemaRV2);
      } catch (error) {
        return;
      }

      // Apply the changes
      await inductor.setState([schemaRV2]);

      // Verify the changes
      const columnRV2 = await inductor.driver.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isUnique because the sanity checker may change it for the given column type
      expect(columnRV2.is_unique).toBe(schemaRV2.columns[colName].isUnique);

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isUnique = false;

      await inductor.setState([schemaRV3]);

      const columnRV3 = await inductor.driver.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isUnique because the sanity checker may change it for the given column type
      expect(columnRV3.is_unique).toBe(schemaRV3.columns[colName].isUnique);
    },
    5_000,
  );

  test.each(Object.keys(allColumn))(
    'should be able to create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;

      const schema: ISchema = {
        tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          [columnKey]: allColumn[columnKey],
          pair_for_comp: {
            type: PostgresColumnType.BIGINT,
            kind: 'column',
            isUnique: false,
            isPrimary: false,
            isNullable: false,
            isIndexed: false,
          },
        },
      };

      // Ensure the column is not unique
      schema.columns[columnKey].isUnique = false;

      // Create the composite unique
      schema.uniques = {
        pair: [columnKey, 'pair_for_comp'],
      };

      try {
        inductor.driver.validateSchema(schema);
      } catch (error) {
        return;
      }

      // Apply the statement
      await inductor.setState([schema]);

      const reversedUniqueName = `${tableName}_pair`;

      // Verify if the column is not unique
      const uniques =
        await inductor.driver.migrator.inspector.getCompositeUniques(tableName);

      if (schema.uniques.pair.length === 2) {
        expect(uniques).toStrictEqual({
          [reversedUniqueName]: schema.uniques.pair,
        });
      } else {
        expect(uniques).toStrictEqual({});
      }
    },
  );

  test('should be able to alter between compound unique states', async () => {
    const schema: ISchema = {
      tableName: 'unique_test_upgrade',
      kind: 'table',
      uniques: {},
      indexes: {},
      columns: {
        col_1: {
          kind: 'column',
          type: PostgresColumnType.INTEGER,
          isNullable: false,
          isUnique: true,
          isPrimary: false,
          isIndexed: false,
        },
        col_2: {
          kind: 'column',
          type: PostgresColumnType.INTEGER,
          isNullable: false,
          isUnique: false,
          isPrimary: false,
          isIndexed: false,
        },
      },
    };

    // Create the table with a single unique
    await inductor.setState([schema]);

    // Verify the single unique column
    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'unique_test_upgrade',
          'col_1',
        )
      ).is_unique,
    ).toBeTruthy();

    // Set the second column as unique to convert the index into a compositive one
    schema.columns.col_1.isUnique = false;
    schema.uniques.test_cmp_1 = ['col_1', 'col_2'];

    // Apply the statement
    await inductor.setState([schema]);

    // Verify the composite unique column
    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'unique_test_upgrade',
          'col_1',
        )
      ).is_unique,
    ).toBeFalsy();
    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'unique_test_upgrade',
          'col_2',
        )
      ).is_unique,
    ).toBeFalsy();

    // Verify the composite unique
    const uniques =
      await inductor.driver.migrator.inspector.getCompositeUniques(
        'unique_test_upgrade',
      );
    expect(uniques).toStrictEqual({
      unique_test_upgrade_test_cmp_1: ['col_1', 'col_2'],
    });

    // Create a new column and add it to the composite unique
    schema.columns.col_3 = {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: false,
      isIndexed: false,
    };

    schema.uniques.test_cmp_1.push('col_3');

    // Apply the statement
    await inductor.setState([schema]);

    // Verify the composite unique
    const uniques2 =
      await inductor.driver.migrator.inspector.getCompositeUniques(
        'unique_test_upgrade',
      );
    expect(uniques2).toStrictEqual({
      unique_test_upgrade_test_cmp_1: ['col_1', 'col_2', 'col_3'],
    });

    // Remove the composite unique
    delete schema.uniques.test_cmp_1;

    // Apply the statement
    await inductor.setState([schema]);

    // Verify the composite unique
    const uniques3 =
      await inductor.driver.migrator.inspector.getCompositeUniques(
        'unique_test_upgrade',
      );
    expect(uniques3).toStrictEqual({});
  });
});
