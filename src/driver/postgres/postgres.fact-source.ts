import { Knex } from 'knex';
import { PostgresForeignAction } from '../../interface/blueprint/postgres/postgres.foreign-action';
import { IFacts } from '../../interface/fact/facts.interface';
import { BaseFactSource } from '../abstract/base.fact-source';

/**
 * Reads the connection's database into a set of structure
 */
export class PostgresFactSource extends BaseFactSource {
  constructor(knex: Knex) {
    super(knex);
  }

  async getTables(): Promise<string[]> {
    return (
      await this.knex({
        rel: 'pg_class',
      })
        .select({
          tableName: 'rel.relname',
        })
        .where({
          'rel.relkind': 'r',
          'rel.relnamespace': this.knex.raw('current_schema::regnamespace'),
        })
    ).map(r => r.tableName);
  }

  async getDefinedTypes(): Promise<string[]> {
    const query = this.knex({
      t: 'pg_type',
    })
      .select({
        type: 't.typname',
      })
      .join(
        {
          ns: 'pg_namespace',
        },
        {
          'ns.oid': 't.typnamespace',
        },
      )
      .where({
        'ns.nspname': this.knex.raw('current_schema()'),
        't.typisdefined': true,
      })
      .whereNot({
        't.typarray': 0,
      });

    return (await query).map(r => r.type);
  }

  async getEnumerators(): Promise<IFacts['enumerators']> {
    const query = this.knex({
      e: 'pg_enum',
    })
      .select({
        table: 'c.table_name',
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
      .orderBy('e.enumsortorder', 'asc');

    const rows: {
      table: string;
      type: string;
      value: string;
      column: string;
    }[] = await query;

    const fact: IFacts['enumerators'] = {};

    for (const row of rows) {
      if (!fact.hasOwnProperty(row.table)) {
        fact[row.table] = {};
      }

      if (!fact[row.table].hasOwnProperty(row.column)) {
        fact[row.table][row.column] = {
          nativeType: row.type,
          values: [],
        };
      }

      fact[row.table][row.column].values.push(row.value);
    }

    return fact;
  }

  async getRelations(): Promise<IFacts['relations']> {
    const fact: IFacts['relations'] = {};

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
        // Important for composite remote keys, where the order matters
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
        // 'fks.table_name': tableName,
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
      // Create the table key
      if (!fact.hasOwnProperty(row.localTableName)) {
        fact[row.localTableName] = {};
      }

      const tableRef = fact[row.localTableName];

      // Create the contraint key
      if (!tableRef.hasOwnProperty(row.relationName)) {
        tableRef[row.relationName] = {
          columns: [row.localColumnName],
          references: {
            table: row.remoteTableName,
            columns: [row.remoteColumnName],
          },
          isLocalUnique: true,
          onDelete: row.deleteRule.toLowerCase() as PostgresForeignAction,
          onUpdate: row.updateRule.toLowerCase() as PostgresForeignAction,
        };
      }
      // Add the new column
      else {
        tableRef[row.relationName].columns.push(row.localColumnName);
        tableRef[row.relationName].references.columns.push(
          row.remoteColumnName,
        );
      }
    }

    return fact;
  }

  async getUniqueConstraints(): Promise<string[]> {
    return (
      await this.knex({
        tc: 'information_schema.table_constraints',
      })
        .select({
          uniqueName: 'tc.constraint_name',
        })
        .where({
          'tc.constraint_type': 'UNIQUE',
          'tc.table_schema': this.knex.raw('current_schema()'),
        })
    ).map(r => r.uniqueName);
  }

  /**
   * Read the database table definition for indexes.
   */
  async getIndexes(): Promise<IFacts['indexes']> {
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
        //'c.relname': tableName,
      })
      .whereNot({
        'i.oid': 0,
      })
      .whereNull('p.contype')
      .orderBy('f.attnum', 'asc');

    const rows = await query;
    const fact: IFacts['indexes'] = {};

    for (const row of rows) {
      if (!fact.hasOwnProperty(row.table)) {
        fact[row.table] = {};
      }

      if (!fact[row.table].hasOwnProperty(row.idx_name)) {
        fact[row.table][row.idx_name] = {
          columns: [],
          type: row.idx_type,
        };
      }

      fact[row.table][row.idx_name].columns.push(row.column);
    }

    return fact;
  }

  async getUniques(): Promise<IFacts['uniques']> {
    const fact: IFacts['uniques'] = {};

    const query = this.knex({
      tc: 'information_schema.table_constraints',
    })
      .select({
        tableName: 'tc.table_name',
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
        //'tc.table_name': tableName,
      });

    const rows = await query;

    for (const row of rows) {
      if (!fact.hasOwnProperty(row.tableName)) {
        fact[row.tableName] = {};
      }

      const tableRef = fact[row.tableName];

      if (!tableRef.hasOwnProperty(row.uniqueName)) {
        tableRef[row.uniqueName] = {
          columns: [row.columnName],
        };
      } else {
        tableRef[row.uniqueName].columns.push(row.columnName);
      }
    }

    return fact;
  }

  async getCompositePrimaryKeys(): Promise<IFacts['compositePrimaryKeys']> {
    const query = this.knex({
      tc: 'information_schema.table_constraints',
    })
      .select({
        tableName: 'tc.table_name',
        contraintName: 'tc.constraint_name',
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
      });

    const fact: IFacts['compositePrimaryKeys'] = {};

    for (const row of await query) {
      if (!fact.hasOwnProperty(row.tableName)) {
        fact[row.tableName] = [];
      }

      fact[row.tableName].push(row.columnName);
    }

    return fact;
  }

  async getColumnValues(): Promise<IFacts['columnValues']> {
    const query = this.knex({
      a: 'pg_catalog.pg_attribute',
    })
      .select({
        tableName: 'pc.relname',
        column: 'a.attname',
        isNotNull: 'attnotnull',
        defaultValue: this.knex.raw('pg_get_expr(d.adbin, d.adrelid)'),
        typeName: this.knex.raw('ty.typname::regtype::text'),
        comment: 'de.description',
        atttypid: 'a.atttypid',
        atttypmod: this.knex.raw('a.atttypmod::int4'),
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
      .join(
        {
          ty: 'pg_catalog.pg_type',
        },
        {
          'ty.oid': 'a.atttypid',
        },
      )
      .leftJoin(
        {
          de: 'pg_description',
        },
        join => {
          join.on(
            this.knex.raw('(a.attrelid, a.attnum)=(de.objoid, de.objsubid)'),
          );
        },
      )
      .whereNot('a.attisdropped', true)
      .andWhere('a.attnum', '>', 0)
      .andWhere({
        'pn.nspname': this.knex.raw('current_schema()'),
        //'pc.relname': tableName,
      });

    const facts: IFacts['columnValues'] = {};
    const rows: {
      tableName: string;
      column: string;
      isNotNull: string;
      defaultValue: string;
      typeName: string;
      comment: string;
      atttypid: number;
      atttypmod: number;
    }[] = await query;

    console.log(rows);

    for (const row of rows) {
      if (!facts.hasOwnProperty(row.tableName)) {
        facts[row.tableName] = {};
      }

      const defaultValue =
        row.defaultValue === null
          ? row.isNotNull
            ? undefined
            : null
          : [
              'NULL::bpchar',
              'NULL::"bit"',
              'NULL::bit varying',
              'NULL::character varying',
              'NULL::numeric',
            ].includes(row.defaultValue)
          ? null
          : row.defaultValue.replace(/^'(.+)'::.+$/, '$1');

      let maxLength = null;

      console.log(row);

      switch (row.atttypid) {
        case 1042:
        case 1043:
          maxLength = row.atttypmod - 4;
          break;

        case 1560:
        case 1562:
          maxLength = row.atttypmod;
          break;
      }

      let precision = null;

      switch (row.atttypid) {
        case 21:
          precision = 16;
          break;
        case 23:
          precision = 32;
          break;
        case 20:
          precision = 64;
          break;
        case 700:
          precision = 24;
          break;
        case 701:
          precision = 53;
          break;
        case 1700:
          if (row.atttypmod == -1) {
            precision = null;
          } else {
            precision = ((row.atttypmod - 4) >> 16) & 65535;
          }
          break;
      }

      let scale = null;

      switch (row.atttypid) {
        case 20:
        case 21:
        case 23:
          scale = 0;
          break;
        case 1700:
          if (row.atttypmod == -1) {
            scale = null;
          } else {
            scale = (row.atttypmod - 4) & 65535;
          }
          break;
      }

      console.log({ maxLength, scale, precision });

      facts[row.tableName][row.column] = {
        defaultValue,
        isNullable: !row.isNotNull,
        typeName: row.typeName,
        maxLength,
        precision,
        scale,
        comment: row.comment,
      };
    }

    return facts;
  }
}
