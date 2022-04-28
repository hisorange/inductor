import { Connection } from '../src/connection';
import { ISchema } from '../src/interface/schema.interface';
import { createConnection } from './util/create-connection';

describe('Create Table from Schema', () => {
  let connection: Connection;
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];

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

  test.each(testTables)(
    'should create the [%s] table from schema',
    async (tableName: string) => {
      const schema: ISchema = {
        name: tableName,
        kind: 'table',
        columns: {},
      };

      await connection.setState([schema]);

      expect(await connection.knex.schema.hasTable(tableName)).toBeTruthy();
    },
    5_000,
  );
});
