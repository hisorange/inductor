import cloneDeep from 'lodash.clonedeep';
import { IBlueprint } from '../../src/interface/blueprint/blueprint.interface';
import { PostgresColumnType } from '../../src/interface/blueprint/postgres/postgres.column-type';
import { PostgresIndexType } from '../../src/interface/blueprint/postgres/postgres.index-type';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createPostgresColumnWithType } from './util/all-column';
import { createPostgresTestInstance } from './util/create-connection';

describe('[Postgres] Drop Column', () => {
  const inductor = createPostgresTestInstance();
  const clearTables = () =>
    Promise.all(
      testTables.map(name => inductor.driver.migrator.dropTable(name)),
    );

  const columns: IBlueprint['columns'] = {
    col_var_1: {
      ...createPostgresColumnWithType(PostgresColumnType.INTEGER),
      isPrimary: true,
    },
    col_var_2: {
      ...createPostgresColumnWithType(PostgresColumnType.INTEGER),
      isNullable: true,
      defaultValue: null,
    },
    col_var_3: {
      ...createPostgresColumnWithType(PostgresColumnType.INTEGER),
      isUnique: true,
    },
    col_var_4: {
      ...createPostgresColumnWithType(PostgresColumnType.INTEGER),
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

      const blueprintRV1 = createBlueprint(tableName);
      blueprintRV1.columns = columns;
      await inductor.migrate([blueprintRV1]);

      expect((await inductor.reverse([tableName]))[0]).toStrictEqual(
        blueprintRV1,
      );

      const blueprintRV2 = cloneDeep(blueprintRV1);
      delete blueprintRV2.columns[col];
      await inductor.migrate([blueprintRV2]);

      expect((await inductor.reverse([tableName]))[0]).toStrictEqual(
        blueprintRV2,
      );
    },
    5_000,
  );
});
