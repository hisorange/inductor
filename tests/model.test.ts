import { Pojo } from 'objection';
import { InitiateTable } from '../src/library/table.initiator';
import { ColumnType } from '../src/types/column-type.enum';
import { ColumnCapability } from '../src/types/column.capability';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';

describe('Model', () => {
  const driver = createTestDriver();

  afterAll(() => driver.close());

  test('should handle createdAt on insert', async () => {
    const tableName = 'model_created_at';
    const table = InitiateTable(tableName);

    // Drop table if exists from a previous test
    await driver.migrator.drop(tableName);

    table.columns = {
      id: {
        ...createTestColumn(ColumnType.SERIAL),
        isPrimary: true,
        alias: 'identifier',
      },
      data: {
        ...createTestColumn(ColumnType.TEXT),
      },
      created_at: {
        ...createTestColumn(ColumnType.TIMESTAMP),
        alias: 'createdAtPropAlias',
        capabilities: [ColumnCapability.CREATED_AT],
      },
      version_x: {
        ...createTestColumn(ColumnType.INTEGER),
        capabilities: [ColumnCapability.VERSION],
        alias: 'vx',
        isNullable: false,
        defaultValue: 0,
      },
    };

    await driver.set([table]);
    expect(table).toStrictEqual((await driver.read([tableName]))[0]);

    const model = driver.modeller.getModel(tableName);
    const insert = (await model.query().insertAndFetch({
      identifier: 5,
      data: 'test',
    })) as Pojo;
    const after = new Date().getTime();

    expect(insert).toHaveProperty('createdAtPropAlias');
    expect(insert.createdAtPropAlias).toBeDefined();
    expect(new Date(insert.createdAtPropAlias).getTime()).toBeLessThanOrEqual(
      after,
    );

    expect(insert).toHaveProperty('vx');
    expect(insert.vx).toBeDefined();
    expect(insert.vx).toBe(1);

    // Update the record
    (await insert.$query().update({
      data: 'test2',
    })) as Pojo;

    // const updated = (await model.query().findById(5)) as Pojo;

    // expect(updated).toHaveProperty('createdAtPropAlias');
    // expect(updated).toHaveProperty('vx');
    // expect(updated.vx).toBe(2);

    await driver.migrator.drop(tableName);
  });
});
