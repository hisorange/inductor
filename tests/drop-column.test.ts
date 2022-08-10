import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../src/interface/schema/postgres/postgres.column-type';
import { PostgresIndexType } from '../src/interface/schema/postgres/postgres.index-type';
import { ISchema } from '../src/interface/schema/schema.interface';
import { createSchema } from '../src/util/create-schema';
import { createColumnWithType } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Drop Column', () => {
  const inductor = createTestInstance();
  const clearTables = () =>
    Promise.all(
      testTables.map(name => inductor.driver.migrator.dropTable(name)),
    );

  const columns: ISchema['columns'] = {
    col_var_1: {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isPrimary: true,
    },
    col_var_2: {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isNullable: true,
      defaultValue: null,
    },
    col_var_3: {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isUnique: true,
    },
    col_var_4: {
      ...createColumnWithType(PostgresColumnType.INTEGER),
      isIndexed: PostgresIndexType.BTREE,
    },
  };

  const testTables = Object.keys(columns).map(name => `drop_column_${name}`);

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await inductor.close();
  });

  test.each(Object.keys(columns))(
    'should drop the [%s] column',
    async col => {
      const tableName = `drop_column_${col}`;

      const schemaRV1 = createSchema(tableName);
      schemaRV1.columns = columns;
      await inductor.setState([schemaRV1]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        schemaRV1,
      );

      const schemaRV2 = cloneDeep(schemaRV1);
      delete schemaRV2.columns[col];
      await inductor.setState([schemaRV2]);

      expect((await inductor.readState([tableName]))[0]).toStrictEqual(
        schemaRV2,
      );
    },
    5_000,
  );
});
