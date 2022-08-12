import BaseAdapter from 'knex-schema-inspector/dist/dialects/postgres';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { IBlueprint } from '../../interface/blueprint/blueprint.interface';
import { PostgresForeignAction } from '../../interface/blueprint/postgres/postgres.foreign-action';
import { IRelation } from '../../interface/blueprint/relation.interface';
import { IInspector } from '../../interface/inspector.interface';
import { IReverseIndex } from '../../interface/reverse/reverse-index.interface';
import { IReverseUnique } from '../../interface/reverse/reverse-unique.interface';

export type IEnumeratorStructure = { column: string; values: string[] };

/**
 * Reads the connection's database into a set of structure
 */
export class PostgresInspector extends BaseAdapter implements IInspector {
  async isTypeExists(typeName: string): Promise<boolean> {
    const query = this.knex('pg_type').where({ typname: typeName }).count();
    const result = await query;

    return result[0].count == 1;
  }

  protected genericTypes(): RegExp[] {
    return [
      /^bigint/i,
      /^int8/i,
      /^bigserial/i,
      /^serial8/i,
      /^bit/i,
      /^bit varying/i,
      /^boolean/i,
      /^bool/i,
      /^box/i,
      /^bytea/i,
      /^character/i,
      /^char/i,
      /^character varying/i,
      /^varchar/i,
      /^cidr/i,
      /^circle/i,
      /^date/i,
      /^double precision/i,
      /^float8/i,
      /^inet/i,
      /^integer/i,
      /^int/i,
      /^int4/i,
      /^interval/i,
      /^line/i,
      /^json/i,
      /^macaddr/i,
      /^jsonb/i,
      /^money/i,
      /^lseg/i,
      /^decimal/i,
      /^macaddr8/i,
      /^pg_lsn/i,
      /^numeric/i,
      /^point/i,
      /^path/i,
      /^real/i,
      /^pg_snapshot/i,
      /^smallint/i,
      /^polygon/i,
      /^smallserial/i,
      /^float4/i,
      /^serial/i,
      /^int2/i,
      /^text/i,
      /^serial2/i,
      /^timetz/i,
      /^serial4/i,
      /^tsquery/i,
      /^time/i,
      /^txid_snapshot/i,
      /^timestamp/i,
      /^xml/i,
      /^tsvector/i,
      /^uuid/i,
    ];
  }

  async findEnumeratorColumns(
    tableName: string,
    columns: Column[],
  ): Promise<{ column: string; values: string[] }[]> {
    const enumColumns = columns
      .filter(col => !this.genericTypes().some(p => p.test(col.data_type)))
      .map(c => c.name);

    if (enumColumns.length) {
      const query = this.knex({
        e: 'pg_enum',
      })
        .select({
          type: 't.typname',
          value: 'e.enumlabel',
          column: 'c.column_name',
        })
        .join(
          {
            t: 'pg_type',
          },
          {
            't.oid': 'e.enumtypid',
          },
        )
        .join(
          {
            c: 'information_schema.columns',
          },
          {
            't.typname': 'c.udt_name',
          },
        )
        .where({
          'c.table_name': tableName,
        })
        .whereIn('c.column_name', enumColumns)
        .groupBy(['e.enumlabel', 't.typname', 'c.column_name']);

      const rows: { type: string; value: string; column: string }[] =
        await query;
      const enums = new Map<string, string[]>(enumColumns.map(n => [n, []]));

      for (const row of rows) {
        enums.get(row.column)!.push(row.value);
      }

      return Array.from(enums.entries()).map(([column, values]) => ({
        column,
        values,
      }));
    }

    return [];
  }

  async getForeignKeys(tableName: string): Promise<[string, IRelation][]> {
    const relations = new Map<string, IRelation>();

    const query = this.knex({
      fks: 'information_schema.table_constraints',
    })
      .select({
        // Table where the foreign key is defined
        localTableName: 'fks.table_name',
        // Foreign constrain's name
        relationName: 'fks.constraint_name',
        // Foreign key's column
        localColumnName: 'kcu_foreign.column_name',
        // Remote primary key's constraint name
        remotePrimaryKeyConstraint: 'rc.unique_constraint_name',
        // Remote table
        remoteTableName: 'pks.table_name',
        // Target column's name
        remoteColumnName: 'kcu_primary.column_name',
        updateRule: 'rc.update_rule',
        deleteRule: 'rc.delete_rule',
        // Important for compositive remote keys, where the order matters
        ordinalPosition: 'kcu_foreign.ordinal_position',
      })
      .innerJoin(
        { kcu_foreign: 'information_schema.key_column_usage' },
        {
          'fks.table_catalog': 'kcu_foreign.table_catalog',
          'fks.table_schema': 'kcu_foreign.table_schema',
          'fks.table_name': 'kcu_foreign.table_name',
          'fks.constraint_name': 'kcu_foreign.constraint_name',
        },
      )
      .innerJoin(
        { rc: 'information_schema.referential_constraints' },
        {
          'rc.constraint_catalog': 'fks.table_catalog',
          'rc.constraint_schema': 'fks.constraint_schema',
          'rc.constraint_name': 'fks.constraint_name',
        },
      )
      .innerJoin(
        { pks: 'information_schema.table_constraints' },
        {
          'rc.unique_constraint_catalog': 'pks.constraint_catalog',
          'rc.unique_constraint_schema': 'pks.constraint_schema',
          'rc.unique_constraint_name': 'pks.constraint_name',
        },
      )
      .innerJoin(
        {
          kcu_primary: 'information_schema.key_column_usage',
        },
        {
          'pks.table_catalog': 'kcu_primary.table_catalog',
          'pks.table_schema': 'kcu_primary.table_schema',
          'pks.table_name': 'kcu_primary.table_name',
          'pks.constraint_name': 'kcu_primary.constraint_name',
          'kcu_foreign.ordinal_position': 'kcu_primary.ordinal_position',
        },
      )
      .where({
        'fks.constraint_type': 'FOREIGN KEY',
        'pks.constraint_type': 'PRIMARY KEY',
        'fks.table_schema': this.knex.raw('current_schema()'),
        'fks.table_name': tableName,
      })
      .orderBy('fks.constraint_name')
      .orderBy('kcu_foreign.ordinal_position');

    // console.log(query.toString());

    const rows: {
      localTableName: string;
      relationName: string;
      localColumnName: string;
      remotePrimaryKeyConstraint: string;
      remoteTableName: string;
      remoteColumnName: string;
      updateRule: PostgresForeignAction;
      deleteRule: PostgresForeignAction;
      ordinalPosition: number;
    }[] = await query;

    for (const row of rows) {
      // Check if the relation already exists
      if (!relations.has(row.relationName)) {
        relations.set(row.relationName, {
          columns: [row.localColumnName],
          references: {
            table: row.remoteTableName,
            columns: [row.remoteColumnName],
          },
          isLocalUnique: false,
          onDelete: row.deleteRule.toLowerCase() as PostgresForeignAction,
          onUpdate: row.updateRule.toLowerCase() as PostgresForeignAction,
        });
      } else {
        const relation = relations.get(row.relationName)!;
        relation.columns.push(row.localColumnName);
        relation.references.columns.push(row.remoteColumnName);
      }
    }

    return Array.from(relations.entries());
  }

  async getUniqueConstraints(): Promise<string[]> {
    const query = this.knex({
      tc: 'information_schema.table_constraints',
    })
      .select({
        uniqueName: 'tc.constraint_name',
      })
      .where({
        'tc.constraint_type': 'UNIQUE',
        'tc.table_schema': this.knex.raw('current_schema()'),
      });

    const rows = await query;

    return rows.map(r => r.uniqueName);
  }

  /**
   * Read the database table definition for indexes.
   */
  async getIndexes(tableName: string): Promise<IReverseIndex[]> {
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
      .whereNull('p.contype')
      .orderBy('f.attnum', 'asc');

    const rows = await query;
    const indexes: IReverseIndex[] = [];

    rows.forEach(r => {
      const idx = indexes.findIndex(i => i.name === r.idx_name);

      // Create the index entry
      if (idx === -1) {
        indexes.push({
          name: r.idx_name,
          columns: [r.column],
          type: r.idx_type,
        });
      } else {
        // Add the column to the index
        indexes[idx].columns.push(r.column);
      }
    });

    return indexes;
  }

  /**
   * Read the defined uniques for the given table name
   */
  async getUniques(tableName: string): Promise<IReverseUnique[]> {
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
    const uniques: IReverseUnique[] = [];

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

  async getCompositeUniques(tableName: string): Promise<IBlueprint['uniques']> {
    const unique: IBlueprint['uniques'] = {};
    const entries = await this.getUniques(tableName);

    for (const entry of entries) {
      if (entry.columns.length > 1) {
        unique[entry.name] = {
          columns: entry.columns,
        };
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

  async getDefaultValues(
    tableName: string,
  ): Promise<{ column: string; defaultValue: string }[]> {
    const query = this.knex({
      a: 'pg_catalog.pg_attribute',
    })
      .select({
        column: 'a.attname',
        isNotNull: 'attnotnull',
        defaultValue: this.knex.raw('pg_get_expr(d.adbin, d.adrelid)'),
      })
      .leftJoin(
        {
          d: 'pg_catalog.pg_attrdef',
        },
        join => {
          join.on(this.knex.raw('(a.attrelid, a.attnum)=(d.adrelid, d.adnum)'));
        },
      )
      .join(
        {
          pc: 'pg_catalog.pg_class',
        },
        {
          'pc.oid': 'a.attrelid',
        },
      )
      .join(
        {
          pn: 'pg_catalog.pg_namespace',
        },
        {
          'pn.oid': 'pc.relnamespace',
        },
      )
      .whereNot('a.attisdropped', true)
      .andWhere('a.attnum', '>', 0)
      .andWhere({
        'pn.nspname': this.knex.raw('current_schema()'),
        'pc.relname': tableName,
      });

    return (await query).map(r => {
      return {
        column: r.column,
        defaultValue:
          r.defaultValue === null
            ? r.isNotNull
              ? undefined
              : null
            : [
                'NULL::bpchar',
                'NULL::"bit"',
                'NULL::bit varying',
                'NULL::character varying',
                'NULL::numeric',
              ].includes(r.defaultValue)
            ? null
            : r.defaultValue.replace(/^'(.+)'::.+$/, '$1'),
      };
    });
  }
}
