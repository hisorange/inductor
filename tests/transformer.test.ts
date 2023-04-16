import cloneDeep from 'lodash.clonedeep';
import { Model } from 'objection';
import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { Transformers } from '../src/types/transformers.enum';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

type TestModel = {
  id: number;
  transformed: any;
} & Model;

describe('Transformers', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test.each([
    [
      'JSON',
      Transformers.JSON,
      { a: 1, b: 2 },
      { a: 1, b: 2 },
      '{"a":1,"b":2}',
    ],
    [
      'Base16',
      Transformers.BASE16,
      'Hello World',
      'Hello World',
      '48656c6c6f20576f726c64',
    ],
    [
      'Base64',
      Transformers.BASE64,
      'Hello World',
      'Hello World',
      'SGVsbG8gV29ybGQ=',
    ],
    [
      'KebabCase',
      Transformers.KEBAB,
      'hello world',
      'hello-world',
      'hello-world',
    ],
    [
      'SnakeCase',
      Transformers.SNAKE,
      'hello world',
      'hello_world',
      'hello_world',
    ],
  ])(
    'should transform the content to and from %s',
    async (name, transformer, input, output, raw) => {
      const tableName = 'transformer_' + name.toLowerCase() + '_test';
      const table = InitiateTable(tableName);

      // Drop table if exists from a previous test
      await driver.migrator.drop(tableName);

      table.columns = {
        id: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        transformed: {
          ...createTestColumn(ColumnType.TEXT),
          transformers: [transformer],
        },
      };

      await driver.set([table]);

      expect(table).toStrictEqual((await driver.read([tableName]))[0]);

      // Insert a JSON object and retrieve it while it's tranformed to string and back
      const model = driver.modeller.getModel<TestModel>(tableName);
      await model.query().insert({ transformed: input });

      const result = await model.query().first();

      expect(result).toBeDefined();
      expect(result!.transformed).toStrictEqual(output);

      // Query the raw value
      const rawResult = await driver.migrator.connection
        .queryBuilder()
        .select('transformed')
        .from(tableName)
        .first();

      expect(rawResult).toBeDefined();
      expect(rawResult!.transformed).toStrictEqual(raw);

      const tableV2 = cloneDeep(table);

      tableV2.columns.transformed.transformers = [];

      await driver.set([tableV2]);
      expect(tableV2).toStrictEqual((await driver.read([tableName]))[0]);

      // Drop table
      await driver.migrator.drop(tableName);
    },
  );
});
