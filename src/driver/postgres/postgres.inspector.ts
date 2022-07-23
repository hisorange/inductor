import BaseAdapter from 'knex-schema-inspector/dist/dialects/postgres';
import { ISchema } from '../../interface/schema.interface';
import { IUnique } from '../../interface/unique.interface';

/**
 * Reads the connection's database into a set of structure
 */
export class PostgresInspector extends BaseAdapter {
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
