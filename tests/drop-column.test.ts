import cloneDeep from 'lodash.clonedeep';
import { PostgresColumnType } from '../src/driver/postgres/postgres.column-type';
import { PostgresIndexType } from '../src/driver/postgres/postgres.index-type';
import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema/schema.interface';
import { createSchema } from '../src/util/create-schema';
import { createColumnWithType } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Drop Column', () => {
  let inductor: Inductor;

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

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );
  });

  afterAll(async () => {
    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );

    await inductor.close();
  });

  test.each(Object.keys(columns))(
    'should drop the [%s] column',
    async col => {
      const tableName = `drop_column_${col}`;

      // Create the table
      const schemaRV1 = createSchema(tableName);
      schemaRV1.columns = columns;

      // Apply the state
      await inductor.setState([schemaRV1]);

      const columnRV1 = await inductor.driver.inspector.hasColumn(
        tableName,
        col,
      );
      expect(columnRV1).toBeTruthy();

      const schemaRV2 = cloneDeep(schemaRV1);
      delete schemaRV2.columns[col];

      // Apply the changes
      await inductor.setState([schemaRV2]);
      const columnRV2 = await inductor.driver.inspector.hasColumn(
        tableName,
        col,
      );

      // Has to check LENGTH because the hasColumn returns an empty array if the column doesn't exist
      expect(columnRV2?.length).toBeFalsy();
    },
    5_000,
  );
});
