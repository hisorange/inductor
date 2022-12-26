import { initBlueprint } from '../src/blueprint/blueprint.initiator';
import { TestColumns } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Create Table from Blueprint', () => {
  const driver = createTestDriver();
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];
  const clearTables = () =>
    Promise.all(testTables.map(name => driver.migrator.dropTable(name)));

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await driver.closeConnection();
  });

  test.each(testTables)(
    'should create the [%s] table from blueprint',
    async (tableName: string) => {
      const blueprint = initBlueprint(tableName);
      blueprint.columns = TestColumns;

      await driver.setState([blueprint]);
      await driver.factManager.updateFacts();

      expect(driver.factManager.isTableExists(tableName)).toBeTruthy();
    },
  );
});
