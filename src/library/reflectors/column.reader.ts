import { Knex } from 'knex';
import { IDatabaseState } from '../../types/database-state.interface';
import { mapTypname } from '../../utils/map-typname';

export const readColumns = async (
  knex: Knex,
): Promise<IDatabaseState['columnValues']> => {
  const query = knex({
    a: 'pg_catalog.pg_attribute',
  })
    .select({
      tableName: 'pc.relname',
      column: 'a.attname',
      isNotNull: 'attnotnull',
      defaultValue: knex.raw('pg_get_expr(d.adbin, d.adrelid)'),
      typeName: 'ty.typname',
      comment: 'de.description',
      atttypid: 'a.atttypid',
      atttypmod: knex.raw('a.atttypmod::int4'),
    })
    .leftJoin(
      {
        d: 'pg_catalog.pg_attrdef',
      },
      join => {
        join.on(knex.raw('(a.attrelid, a.attnum)=(d.adrelid, d.adnum)'));
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
        join.on(knex.raw('(a.attrelid, a.attnum)=(de.objoid, de.objsubid)'));
      },
    )
    // .whereIn('ty.typtype', ['b', 'c', 'd', 'e', 'r', 'm'])
    .whereNot('a.attisdropped', true)
    .andWhere('a.attnum', '>', 0)
    .andWhere({
      'pn.nspname': knex.raw('current_schema()'),
      //'pc.relname': tableName,
    })
    .orderBy('a.attnum', 'asc');

  const facts: IDatabaseState['columnValues'] = {};
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

    facts[row.tableName][row.column] = {
      defaultValue,
      isNullable: !row.isNotNull,
      typeName: mapTypname(row.typeName),
      maxLength,
      precision,
      scale,
      comment: row.comment,
    };
  }

  return facts;
};
