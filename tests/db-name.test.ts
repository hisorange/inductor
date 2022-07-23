import { Inductor } from '../src/inductor';
import { createTestInstance } from './util/create-connection';

describe('Database Name', () => {
  let inductor: Inductor;

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();
  });

  afterAll(async () => {
    await inductor.close();
  });

  test('should be able to get the database name', async () => {
    const name = await inductor.driver.getDatabaseName();

    expect(name).toBe('inductor');
  });
});
