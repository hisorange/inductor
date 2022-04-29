import cloneDeep from 'lodash.clonedeep';
import { Connection } from '../src/connection';
import { ColumnType } from '../src/enum/column-type.enum';
import { ISchema } from '../src/interface/schema.interface';
import { createConnection } from './util/create-connection';

describe('Drop Column', () => {
  let connection: Connection;

  const columns: ISchema['columns'] = {
    col_var_1: {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: true,
      isUnique: true,
      isPrimary: true,
    },
    col_var_2: {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: true,
      isUnique: false,
      isPrimary: false,
    },
    col_var_3: {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: false,
      isUnique: true,
      isPrimary: false,
    },
    col_var_4: {
      kind: 'column',
      type: ColumnType.INTEGER,
      isNullable: false,
      isUnique: false,
      isPrimary: false,
    },
  };

  const testTables = Object.keys(columns).map(name => `drop_column_${name}`);

  beforeAll(async () => {
    // Create the test connection
    connection = createConnection();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name => connection.knex.schema.dropTableIfExists(name)),
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  test.each(Object.keys(columns))(
    'should be able to drop the [%s] column',
    async col => {
      const tableName = `drop_column_${col}`;

      // Create the table
      const schemaRV1: ISchema = {
        name: tableName,
        kind: 'table',
        columns,
      };
      // Apply the state
      await connection.setState([schemaRV1]);

      const columnRV1 = await connection.migrator.inspector.hasColumn(
        tableName,
        col,
      );
      expect(columnRV1).toBeTruthy();

      const schemaRV2 = cloneDeep(schemaRV1);
      delete schemaRV2.columns[col];

      // Apply the changes
      await connection.setState([schemaRV2]);
      const columnRV2 = await connection.migrator.inspector.hasColumn(
        tableName,
        col,
      );

      // Has to check LENGTH because the hasColumn returns an empty array if the column doesn't exist
      expect(columnRV2?.length).toBeFalsy();
    },
    5_000,
  );
});
