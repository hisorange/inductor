import { InitiateTable } from '../src/library/table.initiator';
import { createTestDriver } from './util/create-connection';

describe('Unlogged Table', () => {
  const driver = createTestDriver(['unlogged_']);

  afterAll(() => driver.close());

  test('should create an ulogged table', async () => {
    const tableName = `unlogged_table_1`;

    const table = InitiateTable(tableName);
    table.isUnlogged = true;

    // Remove table if exists from a previous test
    await driver.migrator.drop(table.name);
    await driver.set([table]);

    expect((await driver.read([tableName]))[0]).toStrictEqual(table);

    // Alter table to be logged
    table.isUnlogged = false;
    await driver.set([table]);

    expect((await driver.read([tableName]))[0]).toStrictEqual(table);

    // Alter table to be unlogged
    table.isUnlogged = true;
    await driver.set([table]);

    expect((await driver.read([tableName]))[0]).toStrictEqual(table);

    // Cleanup
    await driver.migrator.drop(table.name);
  });
});
