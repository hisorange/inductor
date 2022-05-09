import { Connection } from '../src/connection';
import { ColumnType } from '../src/enum/column-type.enum';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createConnection } from './util/create-connection';

describe('Unique', () => {
  let connection: Connection;

  beforeAll(async () => {
    // Create the test connection
    connection = createConnection();
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

  test.each(Object.keys(allColumn))(
    'should be able to create composite unique with [%s] column type',
    async (columnKey: string) => {
      const tableName = `unique_test_comp_${columnKey}`;

      const schema: ISchema = {
        name: tableName,
        kind: 'table',
        uniques: {},
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
});
