import { Inductor } from '../src/inductor';
import { ISchema } from '../src/interface/schema/schema.interface';
import { allColumn } from './util/all-column';
import { createTestInstance } from './util/create-connection';

describe('Create Table from Schema', () => {
  let inductor: Inductor;
  const testTables = ['create_test1', 'create_Test2', 'create_test_3_____'];

  beforeAll(async () => {
    // Create the test connection
    inductor = createTestInstance();

    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );
  });

  afterAll(async () => {
    // Drop test tables from previous tests
    await Promise.all(
      testTables.map(name =>
        inductor.driver.connection.schema.dropTableIfExists(name),
      ),
    );

    await inductor.close();
  });

  test.each(testTables)(
    'should create the [%s] table from schema',
    async (tableName: string) => {
      const schema: ISchema = {
        tableName,
        kind: 'table',
        columns: allColumn,
        uniques: {},
        indexes: {},
        relations: {},
      };

      try {
        inductor.driver.validateSchema(schema);
      } catch (error) {
        return;
      }

      await inductor.setState([schema]);

      expect(
        await inductor.driver.connection.schema.hasTable(tableName),
      ).toBeTruthy();
    },
    5_000,
  );
});
