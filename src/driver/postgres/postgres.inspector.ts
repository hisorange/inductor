import BaseAdapter from 'knex-schema-inspector/dist/dialects/postgres';
import { IIndex } from '../../interface/index.interface';
import { ISchema } from '../../interface/schema.interface';
import { IUnique } from '../../interface/unique.interface';

/**
 * Reads the connection's database into a set of structure
 */
export class PostgresInspector extends BaseAdapter {
  /**
   * Read the database table definition for indexes.
   */
  async getIndexes(tableName: string): Promise<IIndex[]> {
    const query = this.knex({
      f: 'pg_attribute',
    })
      .select({
        schema: 'n.nspname',
        table: 'c.relname',
        column: 'f.attname',
        idx_name: 'i.relname',
        idx_type: 'am.amname',
      })
      .join(
        { c: 'pg_class' },
        {
          'c.oid': 'f.attrelid',
        },
      )
      .leftJoin({ n: 'pg_namespace' }, { 'n.oid': 'c.relnamespace' })
      .leftJoin(
        { p: 'pg_constraint' },
        { 'p.conrelid': 'c.oid', 'f.attnum': this.knex.raw('ANY(p.conkey)') },
      )
      .leftJoin(
        { ix: 'pg_index' },
        {
          'f.attnum': this.knex.raw('ANY(ix.indkey)'),
          'c.oid': 'f.attrelid',
          'ix.indrelid': 'c.oid',
        },
      )
      .leftJoin({ i: 'pg_class' }, { 'ix.indexrelid': 'i.oid' })
      .leftJoin({ am: 'pg_am' }, { 'am.oid': 'i.relam' })
      .where({
        'c.relkind': 'r',
        'n.nspname': this.knex.raw('current_schema()'),
        'c.relname': tableName,
      })
      .whereNot({
        'i.oid': 0,
      })
      .whereNull('p.contype');

    const rows = await query;
    const indexes: IIndex[] = [];

    rows.forEach(r => {
      indexes.push({
        name: r.idx_name,
        columns: [r.column],
        type: r.idx_type,
      });
    });

    return indexes;
  }

  /**
   * Read the defined uniques for the given table name
   */
  async getUniques(tableName: string): Promise<IUnique[]> {
    const query = this.knex({
      tc: 'information_schema.table_constraints',
    })
      .select({
        uniqueName: 'tc.constraint_name',
        columnName: 'kcu.column_name',
      })
      .join(
        { kcu: 'information_schema.key_column_usage' },
        {
          'tc.table_schema': 'kcu.table_schema',
          'tc.table_name': 'kcu.table_name',
          'tc.constraint_name': 'kcu.constraint_name',
        },
      )
      .where({
        'tc.constraint_type': 'UNIQUE',
        'tc.table_schema': this.knex.raw('current_schema()'),
        'tc.table_name': tableName,
      });

    const rows = await query;
    const uniques: IUnique[] = [];

    rows.forEach(r => {
      // Create an empty unique if it doesn't exist
      if (!uniques.find(unq => unq.name === r.uniqueName)) {
        uniques.push({
          name: r.uniqueName,
          columns: [],
        });
      }

      const unq = uniques.find(unq => unq.name === r.uniqueName);

      if (unq) {
        unq.columns.push(r.columnName);
      }
    });

    return uniques;
  }

  async getCompositeUniques(tableName: string): Promise<ISchema['uniques']> {
    const unique: ISchema['uniques'] = {};
    const entries = await this.getUniques(tableName);

    for (const entry of entries) {
      if (entry.columns.length > 1) {
        unique[entry.name] = entry.columns;
      }
    }

    return unique;
  }

  /**
   * Read the defined compositive primary keys for the given table name
   */
  async getCompositePrimaryKeys(tableName: string): Promise<string[]> {
    const query = this.knex({
      tc: 'information_schema.table_constraints',
    })
      .select({
        uniqueName: 'tc.constraint_name',
        columnName: 'kcu.column_name',
      })
      .join(
        { kcu: 'information_schema.key_column_usage' },
        {
          'tc.table_schema': 'kcu.table_schema',
          'tc.table_name': 'kcu.table_name',
          'tc.constraint_name': 'kcu.constraint_name',
        },
      )
      .where({
        'tc.constraint_type': 'PRIMARY KEY',
        'tc.table_schema': this.knex.raw('current_schema()'),
        'tc.table_name': tableName,
      });

    const rows = await query;
    const primaryKeys: string[] = [];

    rows.forEach(r => {
      primaryKeys.push(r.columnName);
    });

    return primaryKeys;
  }
}
