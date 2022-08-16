import { ColumnKind, MySQLColumnType } from '../../src/interface';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createMySQLDriver } from './util/create-test-instance.mysql';

describe('[MySQL] Create Table', () => {
  const driver = createMySQLDriver();

  test.skip('should create blueprint', async () => {
    const tableName = 'test_create_table';
    const blueprint = createBlueprint(tableName);
    blueprint.columns = {
      id: {
        kind: ColumnKind.COLUMN,
        type: {
          name: MySQLColumnType.INTEGER,
        },
        isNullable: true,
        isPrimary: true,
        isUnique: false,
        isIndexed: false,
        defaultValue: null,
      },
    };
    await driver.migrate([blueprint]);

    expect((await driver.reverse([tableName]))[0]).toStrictEqual(blueprint);
  });
});
