import { Pojo } from 'objection';
import { InitiateTable } from '../src/library/initiators';
import { ColumnType } from '../src/types/column-type.enum';
import { ColumnCapability } from '../src/types/column.capability';
import { createTestColumn } from './util/all-column';
import { createTestDriver } from './util/create-connection';
import { createToEqual } from './util/read-equal';

describe('Model', () => {
  const driver = createTestDriver();
  const toEqual = createToEqual(driver);

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
      },
      data: {
        ...createTestColumn(ColumnType.TEXT),
      },
      created_at: {
        ...createTestColumn(ColumnType.TIMESTAMP),
      },
    };

    table.columns.id.meta.alias = 'identifier';
    table.columns.created_at.meta.alias = 'createdAtPropAlias';
    table.columns.created_at.meta.capabilities = [ColumnCapability.CREATED_AT];

    await toEqual(table);

    const model = driver.models.getModel(tableName);
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

    await driver.migrator.drop(tableName);
  });
});
