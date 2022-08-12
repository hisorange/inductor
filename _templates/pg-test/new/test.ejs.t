---
to: tests/postgres/<%= name %>.test.ts
---
import cloneDeep from 'lodash.clonedeep';
import { createBlueprint } from '../../src/util/create-blueprint';
import { createTestInstance } from '../util/create-connection';

describe('[Postgres] <%= name %>', () => {
  const inductor = createTestInstance();
  afterAll(() => inductor.close());

  test('should', async () => {
    const tableName = ``;
    const blueprintRV1 = createBlueprint(tableName);
    blueprintRV1.columns = {};

    // Remove blueprint if exists from a previous test
    await inductor.setState([blueprintRV1]);

    expect((await inductor.readState([tableName]))[0]).toStrictEqual(
      blueprintRV1,
    );

    const blueprintRV2 = cloneDeep(blueprintRV1);
    blueprintRV2.columns = {};

    await inductor.setState([blueprintRV2]);

    expect((await inductor.readState([tableName]))[0]).toStrictEqual(
      blueprintRV2,
    );
  });
});


