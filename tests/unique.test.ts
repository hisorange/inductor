import cloneDeep from 'lodash.clonedeep';
import { Connection } from '../src/connection';
import { ColumnType } from '../src/enum/column-type.enum';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createConnection } from './util/create-connection';

describe('Unique Constraint', () => {
  let connection: Connection;

  const testTables = Object.keys(allColumn);

  beforeAll(async () => {
    // Create the test connection
    connection = createConnection();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        connection.knex.schema.dropTableIfExists(`alter_unique_${name}`),
      ),
    );
  });
  afterAll(async () => {
    await connection.close();
  });

  test.each(Object.keys(allColumn))(
    'should be able to create simple unique on [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_${columnKey}`;

      const schema: ISchema = {
        name: tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          [columnKey]: allColumn[columnKey],
        },
      };
      // Set the column to unique
      schema.columns[columnKey].isUnique = true;

      // Apply the statement
      await connection.setState([schema]);

      expect(await connection.knex.schema.hasTable(tableName)).toBeTruthy();
      expect(
        (await connection.migrator.inspector.columnInfo(tableName, columnKey))
          .is_unique,
      ).toBe(schema.columns[columnKey].isUnique);
    },
  );

  test.each(testTables)(
    'should be able to alter the UNIQUE flag for [%s] column',
    async colName => {
      const tableName = `alter_unique_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        name: tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          id: {
            kind: 'column',
            type: ColumnType.INTEGER,
            isNullable: false,
            isUnique: false,
            isPrimary: true,
          },
          [colName]: allColumn[colName],
          createdAt: {
            kind: 'column',
            type: ColumnType.DATE,
            isNullable: false,
            isUnique: false,
            isPrimary: false,
          },
        },
      };
      // Set nullable to false
      schemaRV1.columns[colName].isUnique = false;

      // Apply the state
      await connection.setState([schemaRV1]);

      const columnRV1 = await connection.migrator.inspector.columnInfo(
        tableName,
        colName,
      );
      expect(columnRV1.is_unique).toBeFalsy();

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the nullable
      schemaRV2.columns[colName].isUnique = true;

      // Apply the changes
      await connection.setState([schemaRV2]);

      // Verify the changes
      const columnRV2 = await connection.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isUnique because the sanity checker may change it for the given column type
      expect(columnRV2.is_unique).toBe(schemaRV2.columns[colName].isUnique);

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isUnique = false;

      await connection.setState([schemaRV3]);

      const columnRV3 = await connection.migrator.inspector.columnInfo(
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
        name: tableName,
        kind: 'table',
        uniques: {},
        indexes: {},
        columns: {
          [columnKey]: allColumn[columnKey],
          pair_for_comp: {
            type: ColumnType.BIGINT,
            kind: 'column',
            isUnique: false,
            isPrimary: false,
            isNullable: false,
          },
        },
      };

      // Ensure the column is not unique
      schema.columns[columnKey].isUnique = false;

      // Create the composite unique
      schema.uniques = {
        pair: [columnKey, 'pair_for_comp'],
      };

      // Apply the statement
      await connection.setState([schema]);

      const reversedUniqueName = `${tableName}_pair`;

      // Verify if the column is not unique
      const uniques = await connection.migrator.inspector.getCompositeUniques(
        tableName,
      );

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
      name: 'unique_test_upgrade',
      kind: 'table',
      uniques: {},
      indexes: {},
      columns: {
        col_1: {
          kind: 'column',
          type: ColumnType.INTEGER,
          isNullable: false,
          isUnique: true,
          isPrimary: false,
        },
        col_2: {
          kind: 'column',
          type: ColumnType.INTEGER,
          isNullable: false,
          isUnique: false,
          isPrimary: false,
        },
      },
    };

    // Create the table with a single unique
    await connection.setState([schema]);

    // Verify the single unique column
    expect(
      (
        await connection.migrator.inspector.columnInfo(
          'unique_test_upgrade',
          'col_1',
        )
      ).is_unique,
    ).toBeTruthy();

    // Set the second column as unique to convert the index into a compositive one
    schema.columns.col_1.isUnique = false;
    schema.uniques.test_cmp_1 = ['col_1', 'col_2'];

    // Apply the statement
    await connection.setState([schema]);

    // Verify the composite unique column
    expect(
      (
        await connection.migrator.inspector.columnInfo(
          'unique_test_upgrade',
          'col_1',
        )
      ).is_unique,
    ).toBeFalsy();
    expect(
      (
        await connection.migrator.inspector.columnInfo(
          'unique_test_upgrade',
          'col_2',
        )
      ).is_unique,
    ).toBeFalsy();

    // Verify the composite unique
    const uniques = await connection.migrator.inspector.getCompositeUniques(
      'unique_test_upgrade',
    );
    expect(uniques).toStrictEqual({
      unique_test_upgrade_test_cmp_1: ['col_1', 'col_2'],
    });

    // Create a new column and add it to the composite unique
    schema.columns.col_3 = {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: false,
    };

    schema.uniques.test_cmp_1.push('col_3');

    // Apply the statement
    await connection.setState([schema]);

    // Verify the composite unique
    const uniques2 = await connection.migrator.inspector.getCompositeUniques(
      'unique_test_upgrade',
    );
    expect(uniques2).toStrictEqual({
      unique_test_upgrade_test_cmp_1: ['col_1', 'col_2', 'col_3'],
    });

    // Remove the composite unique
    delete schema.uniques.test_cmp_1;

    // Apply the statement
    await connection.setState([schema]);

    // Verify the composite unique
    const uniques3 = await connection.migrator.inspector.getCompositeUniques(
      'unique_test_upgrade',
    );
    expect(uniques3).toStrictEqual({});
  });
});
