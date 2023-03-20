import { InitiateTable } from '../src/table/initiator';
import { createTestDriver } from './util/create-connection';

describe('Unlogged Table', () => {
  const driver = createTestDriver(['unlogged_']);

  afterAll(() => driver.closeConnection());

  test('should create an ulogged table', async () => {
    const tableName = `unlogged_table_1`;

    const table = InitiateTable(tableName);
    table.isLogged = false;

    // Remove table if exists from a previous test
    await driver.migrator.dropTableDescriptor(table);
    await driver.setState([table]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(table);

    // Alter table to be logged
    table.isLogged = true;
    await driver.setState([table]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(table);

    // Alter table to be unlogged
    table.isLogged = false;
    await driver.setState([table]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(table);

    // Cleanup
    await driver.migrator.dropTableDescriptor(table);
  });
});
