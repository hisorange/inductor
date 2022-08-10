import cloneDeep from 'lodash.clonedeep';
import { ColumnTools } from '../src';
import { PostgresColumnType } from '../src/interface/schema/postgres/postgres.column-type';
import { PostgresIndexType } from '../src/interface/schema/postgres/postgres.index-type';
import { createSchema } from '../src/util/create-schema';
import { allColumn, createColumnWithType } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Primary Constraint', () => {
  const inductor = createTestInstance();
  const primaryColumns = cloneDeep(allColumn);

  // Remove the non primary able columns
  for (const col in primaryColumns) {
    if (Object.prototype.hasOwnProperty.call(primaryColumns, col)) {
      if (!ColumnTools.postgres.canTypeBePrimary(primaryColumns[col])) {
        delete primaryColumns[col];
      }
    }
  }

  const testTables = Object.keys(primaryColumns);

  const clearTables = async () => {
    await inductor.driver.connection.schema.dropTableIfExists(
      `alter_primary_extend`,
    );

    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(
          `create_primary_${name}`,
        ),
      ),
    );

    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(
          `alter_primary_${name}`,
        ),
      ),
    );
  };

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await inductor.close();
  });

  test.each(testTables)(
    'should create the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `create_primary_${colName}`;
      const testSchema = createSchema(tableName);
      testSchema.columns = {
        [colName]: {
          ...primaryColumns[colName],
          isPrimary: true,
        },
      };
      await inductor.setState([testSchema]);

      expect(testSchema).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
  );

  test.each(testTables.filter(t => !t.match(/serial/)))(
    'should alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;
      const schemaRV1 = createSchema(tableName);
      schemaRV1.columns = {
        prefix: {
          ...createColumnWithType(PostgresColumnType.INTEGER),
        },
        [colName]: allColumn[colName],
        createdAt: {
          ...createColumnWithType(PostgresColumnType.DATE),
          isIndexed: PostgresIndexType.BRIN,
        },
      };

      schemaRV1.columns[colName].isPrimary = false;
      await inductor.setState([schemaRV1]);

      expect(schemaRV1).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const schemaRV2 = cloneDeep(schemaRV1);
      schemaRV2.columns[colName].isPrimary = true;
      await inductor.setState([schemaRV2]);

      expect(schemaRV2).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const schemaRV3 = cloneDeep(schemaRV2);
      // Revert the nullable
      schemaRV3.columns[colName].isPrimary = false;

      await inductor.setState([schemaRV3]);

      expect(schemaRV3).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
    5_000,
  );

  test('should add/remove the primary keys', async () => {
    const tableName = 'alter_primary_extend';
    const schemaRV1 = createSchema(tableName);
    schemaRV1.columns = {
      first: {
        ...createColumnWithType(PostgresColumnType.INTEGER),
        isPrimary: true,
      },
    };
    await inductor.setState([schemaRV1]);

    expect(schemaRV1).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Extend the primary
    const schemaRV2 = cloneDeep(schemaRV1);
    schemaRV2.columns.second = {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isPrimary: true,
    };
    await inductor.setState([schemaRV2]);

    expect(schemaRV2).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Add the third primary column
    const schemaRV3 = cloneDeep(schemaRV2);
    schemaRV3.columns.third = {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isPrimary: true,
    };
    await inductor.setState([schemaRV3]);

    expect(schemaRV3).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Remove the third primary column
    const schemaRV4 = cloneDeep(schemaRV3);
    schemaRV4.columns.third.isPrimary = false;
    await inductor.setState([schemaRV4]);

    expect(schemaRV4).toStrictEqual((await inductor.readState([tableName]))[0]);

    // Remove the second primary column
    const schemaRV5 = cloneDeep(schemaRV4);
    schemaRV5.columns.second.isPrimary = false;
    await inductor.setState([schemaRV5]);

    expect(schemaRV5).toStrictEqual((await inductor.readState([tableName]))[0]);
  });
});
