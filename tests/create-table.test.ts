import { createBlueprint } from '../src/util/create-blueprint';
import { allColumn } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Create Table from Blueprint', () => {
  const inductor = createTestInstance();
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];
  const clearTables = () =>
    Promise.all(
      testTables.map(name => inductor.driver.migrator.dropTable(name)),
    );

  beforeAll(() => clearTables());

  afterAll(async () => {
    await clearTables();
    await inductor.close();
  });

  test.each(testTables)(
    'should create the [%s] table from blueprint',
    async (tableName: string) => {
      const blueprint = createBlueprint(tableName);
      blueprint.columns = allColumn;

      await inductor.setState([blueprint]);
      await inductor.driver.facts.refresh();

      expect(inductor.driver.facts.isTableExists(tableName)).toBeTruthy();
    },
  );
});
