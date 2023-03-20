import { ColumnType, IColumn } from '../src';
import { InitiateSchema } from '../src/schema/initiator';
import { ColumnTools } from '../src/tools/column-tools';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Column Adding', () => {
  const driver = createTestDriver();
  const cases: [string, IColumn][] = ColumnTools.listColumnTypes()
    .filter(type => type !== ColumnType.BIT_VARYING)
    .map(type => [type, createTestColumn(type)]);

  afterAll(() => driver.closeConnection());

  test.each(cases)(
    'should add [%s] type column',
    async (columnType: string, columnDef: IColumn) => {
      const columnSlug = columnType.replace(/\W/g, '_');
      const columnName = `column_${columnSlug}`;
      const tableName = `column_add_${columnSlug}`;

      const schema = InitiateSchema(tableName);
      schema.columns = {
        primary_column: {
          ...createTestColumn(ColumnType.SERIAL),
          isPrimary: true,
        },
        [columnName]: columnDef,
      };

      // Remove schema if exists from a previous test
      await driver.migrator.dropTable(tableName);
      await driver.setState([schema]);

      expect((await driver.readState([tableName]))[0]).toStrictEqual(schema);

      // Cleanup
      await driver.migrator.dropTable(tableName);
    },
  );
});
