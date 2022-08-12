import cloneDeep from 'lodash.clonedeep';
import { ColumnTools } from '../src';
import { PostgresColumnType } from '../src/interface/blueprint/postgres/postgres.column-type';
import { PostgresIndexType } from '../src/interface/blueprint/postgres/postgres.index-type';
import { createBlueprint } from '../src/util/create-blueprint';
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
    await inductor.driver.migrator.dropTable(`alter_primary_extend`);

    await Promise.all(
      testTables.map(name =>
        inductor.driver.migrator.dropTable(`create_primary_${name}`),
      ),
    );

    await Promise.all(
      testTables.map(name =>
        inductor.driver.migrator.dropTable(`alter_primary_${name}`),
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
      const testBlueprint = createBlueprint(tableName);
      testBlueprint.columns = {
        [colName]: {
          ...primaryColumns[colName],
          isPrimary: true,
        },
      };
      await inductor.setState([testBlueprint]);

      expect(testBlueprint).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
  );

  test.each(testTables.filter(t => !t.match(/serial/)))(
    'should alter the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `alter_primary_${colName}`;
      const blueprintRV1 = createBlueprint(tableName);
      blueprintRV1.columns = {
        prefix: {
          ...createColumnWithType(PostgresColumnType.INTEGER),
        },
        [colName]: allColumn[colName],
        createdAt: {
          ...createColumnWithType(PostgresColumnType.DATE),
          isIndexed: PostgresIndexType.BRIN,
        },
      };

      blueprintRV1.columns[colName].isPrimary = false;
      await inductor.setState([blueprintRV1]);

      expect(blueprintRV1).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      blueprintRV2.columns[colName].isPrimary = true;
      await inductor.setState([blueprintRV2]);

      expect(blueprintRV2).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );

      const blueprintRV3 = cloneDeep(blueprintRV2);
      // Revert the nullable
      blueprintRV3.columns[colName].isPrimary = false;

      await inductor.setState([blueprintRV3]);

      expect(blueprintRV3).toStrictEqual(
        (await inductor.readState([tableName]))[0],
      );
    },
    5_000,
  );

  test('should add/remove the primary keys', async () => {
    const tableName = 'alter_primary_extend';
    const blueprintRV1 = createBlueprint(tableName);
    blueprintRV1.columns = {
      first: {
        ...createColumnWithType(PostgresColumnType.INTEGER),
        isPrimary: true,
      },
    };
    await inductor.setState([blueprintRV1]);

    expect(blueprintRV1).toStrictEqual(
      (await inductor.readState([tableName]))[0],
    );

    // Extend the primary
    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns.second = {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isPrimary: true,
    };
    await inductor.setState([blueprintRV2]);

    expect(blueprintRV2).toStrictEqual(
      (await inductor.readState([tableName]))[0],
    );

    // Add the third primary column
    const blueprintRV3 = cloneDeep(blueprintRV2);
    blueprintRV3.columns.third = {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isPrimary: true,
    };
    await inductor.setState([blueprintRV3]);

    expect(blueprintRV3).toStrictEqual(
      (await inductor.readState([tableName]))[0],
    );

    // Remove the third primary column
    const blueprintRV4 = cloneDeep(blueprintRV3);
    blueprintRV4.columns.third.isPrimary = false;
    await inductor.setState([blueprintRV4]);

    expect(blueprintRV4).toStrictEqual(
      (await inductor.readState([tableName]))[0],
    );

    // Remove the second primary column
    const blueprintRV5 = cloneDeep(blueprintRV4);
    blueprintRV5.columns.second.isPrimary = false;
    await inductor.setState([blueprintRV5]);

    expect(blueprintRV5).toStrictEqual(
      (await inductor.readState([tableName]))[0],
    );
  });
});
