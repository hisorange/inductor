import { InitiateTable } from '../src/library/initiators';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Unlogged Table', () => {
  const driver = createTestDriver(['unlogged_']);
  const toEqual = createToEqual(driver);

  afterAll(() => driver.close());

  test('should create an ulogged table', async () => {
    const tableName = `unlogged_table_1`;

    const table = InitiateTable(tableName);
    table.isUnlogged = true;

    // Remove table if exists from a previous test
    await driver.migrator.drop(table.name);
    await toEqual(table);

    // Alter table to be logged
    table.isUnlogged = false;
    await toEqual(table);

    // Alter table to be unlogged
    table.isUnlogged = true;
    await toEqual(table);

    // Cleanup
    await driver.migrator.drop(table.name);
  });
});
