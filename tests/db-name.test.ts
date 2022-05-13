import { Connection } from '../src/connection';
import { createConnection } from './util/create-connection';

describe('Database Name', () => {
  let connection: Connection;

  beforeAll(async () => {
    // Create the test connection
    connection = createConnection();
  });

  afterAll(async () => {
    await connection.close();
  });

  test('should be able to get the database name', async () => {
    const name = await connection.getDatabaseName();

    expect(name).toBe('inductor');
  });
});
