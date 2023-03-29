import { InitiateTable } from '../src/library/table.initiator';
import { TestColumns } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Create Table from Table', () => {
  const driver = createTestDriver();
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];
  const clearTables = () =>
    Promise.all(testTables.map(name => driver.migrator.drop(name)));

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await driver.close();
  });

  test.each(testTables)(
    'should create the [%s] table from table',
    async (tableName: string) => {
      const table = InitiateTable(tableName);
      table.columns = TestColumns;

      await driver.set([table]);

      const newState = await driver.migrator.read();

      expect(newState.find(t => table.name == tableName)).toBeTruthy();
    },
  );
});
