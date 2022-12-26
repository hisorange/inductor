import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { createTestDriver } from './util/create-connection';

describe('Unlogged Table', () => {
  const driver = createTestDriver(['unlogged_']);

  afterAll(() => driver.closeConnection());

  test('should create an ulogged table', async () => {
    const tableName = `unlogged_table_1`;

    const blueprint = initBlueprint(tableName);
    blueprint.isLogged = false;

    // Remove blueprint if exists from a previous test
    await driver.migrationManager.dropBlueprint(blueprint);
    await driver.setState([blueprint]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprint);

    // Alter table to be logged
    blueprint.isLogged = true;
    await driver.setState([blueprint]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprint);

    // Alter table to be unlogged
    blueprint.isLogged = false;
    await driver.setState([blueprint]);

    expect((await driver.readState([tableName]))[0]).toStrictEqual(blueprint);

    // Cleanup
    await driver.migrationManager.dropBlueprint(blueprint);
  });
});
