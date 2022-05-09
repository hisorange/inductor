import cloneDeep from 'lodash.clonedeep';
import { Connection } from '../src/connection';
import { ColumnType } from '../src/enum/column-type.enum';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createConnection } from './util/create-connection';

describe('Alter Primary', () => {
  let connection: Connection;
  const testTables = Object.keys(allColumn);

  beforeAll(async () => {
    // Create the test connection
    connection = createConnection();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        connection.knex.schema.dropTableIfExists(`alter_primary_${name}`),
      ),
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  test.each(testTables)(
    'should be able to alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        name: tableName,
        kind: 'table',
        columns: {
          prefix: {
            kind: 'column',
            type: ColumnType.INTEGER,
            isNullable: false,
            isUnique: false,
            isPrimary: false,
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
        uniques: {},
      };
      // Set primary to false
      schemaRV1.columns[colName].isPrimary = false;

      // Apply the state
      await connection.setState([schemaRV1]);

      const columnRV1 = await connection.migrator.inspector.columnInfo(
        tableName,
        colName,
      );
      expect(columnRV1.is_primary_key).toBeFalsy();

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the primary flag
      schemaRV2.columns[colName].isPrimary = true;

      // Apply the changes
      await connection.setState([schemaRV2]);

      // Verify the changes
      const columnRV2 = await connection.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isPrimary because the sanity checker may change it for the given column type
      expect(columnRV2.is_primary_key).toBe(
        schemaRV2.columns[colName].isPrimary,
      );

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isPrimary = false;

      await connection.setState([schemaRV3]);

      const columnRV3 = await connection.migrator.inspector.columnInfo(
        tableName,
        colName,
      );

      // We are reading the isPrimary because the sanity checker may change it for the given column type
      expect(columnRV3.is_primary_key).toBe(
        schemaRV3.columns[colName].isPrimary,
      );
    },
    5_000,
  );

  test('should be able to add/remove the primary keys', async () => {
    const schema: ISchema = {
      name: 'alter_primary_extend',
      kind: 'table',
      columns: {
        first: {
          kind: 'column',
          type: ColumnType.INTEGER,
          isNullable: false,
          isUnique: false,
          isPrimary: true,
        },
      },
      uniques: {},
    };

    // Create with one primary
    await connection.setState([schema]);

    expect(
      (
        await connection.migrator.inspector.columnInfo('alter_primary_extend')
      ).filter(c => c.is_primary_key).length,
    ).toEqual(1);

    // Extend the primary
    const schemaExtend: ISchema = cloneDeep(schema);
    schemaExtend.columns.second = {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: true,
    };

    // Update the state to extend the primary to two
    await connection.setState([schemaExtend]);

    expect(
      (
        await connection.migrator.inspector.columnInfo('alter_primary_extend')
      ).filter(c => c.is_primary_key).length,
    ).toEqual(0);

    expect(
      await connection.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first', 'second']);

    // Add the third primary column
    const schemaExtend2: ISchema = cloneDeep(schemaExtend);
    schemaExtend2.columns.third = {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: true,
    };

    // Update the state to extend the primary to three
    await connection.setState([schemaExtend2]);

    expect(
      (
        await connection.migrator.inspector.columnInfo('alter_primary_extend')
      ).filter(c => c.is_primary_key).length,
    ).toEqual(0);

    expect(
      await connection.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first', 'second', 'third']);

    // Remove the third primary column
    const schemaExtend3: ISchema = cloneDeep(schemaExtend2);
    schemaExtend3.columns.third.isPrimary = false;

    // Update the state to remove the third primary
    await connection.setState([schemaExtend3]);

    expect(
      (
        await connection.migrator.inspector.columnInfo('alter_primary_extend')
      ).filter(c => c.is_primary_key).length,
    ).toEqual(0);

    expect(
      await connection.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first', 'second']);

    // Remove the second primary column
    const schemaExtend4: ISchema = cloneDeep(schemaExtend3);
    schemaExtend4.columns.second.isPrimary = false;

    // Update the state to remove the second primary
    await connection.setState([schemaExtend4]);

    expect(
      (
        await connection.migrator.inspector.columnInfo('alter_primary_extend')
      ).filter(c => c.is_primary_key).length,
    ).toEqual(1);

    expect(
      await connection.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first']);
  });
});
