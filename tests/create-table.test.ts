import { Connection } from '../src/connection';
import { IBlueprint } from '../src/interface/blueprint.interface';
import { createConnection } from './util/create-connection';

describe('Table creation', () => {
  let conn: Connection;

  beforeAll(() => {
    conn = createConnection();
  });

  afterAll(async () => {
    await conn.close();
  });

  test.each(['test', '__test', 'TeSt_ted'])(
    'should create the [%s] table from the blueprint',
    async (id: string) => {
      const blueprint: IBlueprint = {
        id,
        kind: 'table',
      };

      await conn.associate(blueprint);

      expect(await conn.migrator.inspector.tables()).toContain(id);
    },
    5_000,
  );
});
