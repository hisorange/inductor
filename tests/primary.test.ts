import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../src/driver/postgres/postgres.column-type';
import { PostgresIndexType } from '../src/driver/postgres/postgres.index-type';
import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Primary Constraint', () => {
  let inductor: Inductor;
  const testTables = Object.keys(allColumn);

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(
          `alter_primary_${name}`,
        ),
      ),
    );
  });

  afterAll(async () => {
    await inductor.close();
  });

  test.each(testTables)(
    'should be able to create the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `create_primary_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        tableName,
        kind: 'table',
        columns: {
          [colName]: allColumn[colName],
        },
        uniques: {},
        indexes: {},
      };
      // Set primary to false
      schemaRV1.columns[colName].isPrimary = true;

      // Validate the schema
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
      expect(columnRV1.is_primary_key).toBe(
        schemaRV1.columns[colName].isPrimary,
      );
    },
    5_000,
  );

  test.each(testTables)(
    'should be able to alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        tableName,
        kind: 'table',
        columns: {
          prefix: {
            kind: 'column',
            type: PostgresColumnType.INTEGER,
            isNullable: false,
            isUnique: false,
            isPrimary: false,
            isIndexed: false,
          },
          [colName]: allColumn[colName],
          createdAt: {
            kind: 'column',
            type: PostgresColumnType.DATE,
            isNullable: false,
            isUnique: false,
            isPrimary: false,
            isIndexed: PostgresIndexType.BRIN,
          },
        },
        uniques: {},
        indexes: {},
      };
      // Set primary to false
      schemaRV1.columns[colName].isPrimary = false;

      // Validate the schema
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
      expect(columnRV1.is_primary_key).toBeFalsy();

      const schemaRV2 = cloneDeep(schemaRV1);
      // Change the primary flag
      schemaRV2.columns[colName].isPrimary = true;

      // Validate the schema
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

      // We are reading the isPrimary because the sanity checker may change it for the given column type
      expect(columnRV2.is_primary_key).toBe(
        schemaRV2.columns[colName].isPrimary,
      );

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isPrimary = false;

      await inductor.setState([schemaRV3]);

      const columnRV3 = await inductor.driver.migrator.inspector.columnInfo(
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
      tableName: 'alter_primary_extend',
      kind: 'table',
      columns: {
        first: {
          kind: 'column',
          type: PostgresColumnType.INTEGER,
          isNullable: false,
          isUnique: false,
          isPrimary: true,
          isIndexed: false,
        },
      },
      uniques: {},
      indexes: {},
    };

    // Create with one primary
    await inductor.setState([schema]);

    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'alter_primary_extend',
        )
      ).filter(c => c.is_primary_key).length,
    ).toEqual(1);

    // Extend the primary
    const schemaExtend: ISchema = cloneDeep(schema);
    schemaExtend.columns.second = {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: true,
      isIndexed: false,
    };

    // Update the state to extend the primary to two
    await inductor.setState([schemaExtend]);

    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'alter_primary_extend',
        )
      ).filter(c => c.is_primary_key).length,
    ).toEqual(0);

    expect(
      await inductor.driver.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first', 'second']);

    // Add the third primary column
    const schemaExtend2: ISchema = cloneDeep(schemaExtend);
    schemaExtend2.columns.third = {
      kind: 'column',
      type: PostgresColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: true,
      isIndexed: false,
    };

    // Update the state to extend the primary to three
    await inductor.setState([schemaExtend2]);

    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'alter_primary_extend',
        )
      ).filter(c => c.is_primary_key).length,
    ).toEqual(0);

    expect(
      await inductor.driver.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first', 'second', 'third']);

    // Remove the third primary column
    const schemaExtend3: ISchema = cloneDeep(schemaExtend2);
    schemaExtend3.columns.third.isPrimary = false;

    // Update the state to remove the third primary
    await inductor.setState([schemaExtend3]);

    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'alter_primary_extend',
        )
      ).filter(c => c.is_primary_key).length,
    ).toEqual(0);

    expect(
      await inductor.driver.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first', 'second']);

    // Remove the second primary column
    const schemaExtend4: ISchema = cloneDeep(schemaExtend3);
    schemaExtend4.columns.second.isPrimary = false;

    // Update the state to remove the second primary
    await inductor.setState([schemaExtend4]);

    expect(
      (
        await inductor.driver.migrator.inspector.columnInfo(
          'alter_primary_extend',
        )
      ).filter(c => c.is_primary_key).length,
    ).toEqual(1);

    expect(
      await inductor.driver.migrator.inspector.getCompositePrimaryKeys(
        'alter_primary_extend',
      ),
    ).toStrictEqual(['first']);
  });
});
