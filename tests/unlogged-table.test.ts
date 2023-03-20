import { InitiateSchema } from '../src/schema/initiator';
import { createTestDriver } from './util/create-connection';

describe('Unlogged Table', () => {
  const driver = createTestDriver(['unlogged_']);

  afterAll(() => driver.closeConnection());

  test('should create an ulogged table', async () => {
    const tableName = `unlogged_table_1`;

    const schema = InitiateSchema(tableName);
    schema.isLogged = false;

    // Remove schema if exists from a previous test
    await driver.migrator.dropSchema(schema);
    await driver.setState([schema]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(schema);

    // Alter table to be logged
    schema.isLogged = true;
    await driver.setState([schema]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(schema);

    // Alter table to be unlogged
    schema.isLogged = false;
    await driver.setState([schema]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(schema);

    // Cleanup
    await driver.migrator.dropSchema(schema);
  });
});
