import { InitiateTable } from '../src/library/initiators';
import { TestColumns } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Create Table from Table', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

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
      table.meta.alias = 'Test' + tableName;

      await toEqual(table);

      // Change the alias and apply the changes
      table.meta.alias = 'Test' + tableName + '2';

      await toEqual(table);
    },
  );
});
