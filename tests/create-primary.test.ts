import { Connection } from '../src/connection';
import { ISchema } from '../src/interface/schema.interface';
import { allColumn } from './util/all-column';
import { createConnection } from './util/create-connection';

describe('Create Primary', () => {
  let connection: Connection;
  const testTables = Object.keys(allColumn);

  beforeAll(async () => {
    // Create the test connection
    connection = createConnection();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        connection.knex.schema.dropTableIfExists(`create_primary_${name}`),
      ),
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  test.each(testTables)(
    'should be able to create the PRIMARY flag for [%s] column',
    async colName => {
      const tableName = `create_primary_${colName}`;

      // Create the table
      const schemaRV1: ISchema = {
        name: tableName,
        kind: 'table',
        columns: {
          [colName]: allColumn[colName],
        },
        uniques: {},
      };
      // Set primary to false
      schemaRV1.columns[colName].isPrimary = true;

      // Apply the state
      await connection.setState([schemaRV1]);

      const columnRV1 = await connection.migrator.inspector.columnInfo(
        tableName,
        colName,
      );
      expect(columnRV1.is_primary_key).toBe(
        schemaRV1.columns[colName].isPrimary,
      );
    },
    5_000,
  );
});
