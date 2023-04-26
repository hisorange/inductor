[![CD](https://github.com/hisorange/inductor/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/hisorange/inductor/actions/workflows/cd.yml)
[![NPM](https://img.shields.io/npm/dt/@hisorange/inductor?label=NPM+Pulls)](https://www.npmjs.com/package/@hisorange/inductor)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/hisorange/inductor?label=Last+Commit)](https://github.com/hisorange/inductor/commits/main)
![License](https://img.shields.io/github/license/hisorange/inductor?label=License)

# Inductor

Easy to use library to control your database table's schema without migrations or any manual work.
You can simply describe how you want a table to look like, and the rest will be calculated by the library.
It manages the primary keys, uniques, indexes, and even their composite forms for you.

Do you wanna add a new column from a UI? Just add it to your schema and apply it to the database.
With this seamless solution you can forget about migrations, and waiting for the devops / dba to change the database.
Simply automate the database management by commiting your database schema into the code and on the application startup
the connection manager can change your database to your likings.

### Quick Start

```sh
yarn add @hisorange/inductor
# or
npm i @hisorange/inductor
```

### Create the connection

```typescript
import { Inductor } from '@hisorange/inductor';

const driver = new Inductor({
  connection: {
    connectionString: 'postgres://inductor:inductor@localhost:9999/inductor',
  },
  isReadOnly: false,
  filters: ['_artgen_.+', 'wp_.+'],
  metax: [],
});

// Apply the desired state, and the library will create or modify the databse to match the given schema
await driver.setState([
  {
    name: 'my_fast_table',
    isUnlogged: true,
    meta: {
      alias: 'MyFastTable',
    },
    columns: {
      id: {
        type: {
          name: ColumnType.INTEGER,
        },
        isNullable: false,
        isPrimary: true,
      },
      smth: {
        type: {
          name: ColumnType.TEXT,
        },
        isUnique: true,
        isIndexed: IndexType.BTREE,
      },
      password: {
        type: {
          name: ColumnType.TEXT,
        },
        isUnique: true,
        isIndexed: IndexType.BTREE,
        meta: {
          hooks: [ColumnHook.PASSWORD],
        },
      },
      decision: {
        type: {
          name: ColumnType.ENUM,
          values: ['Yes', 'No', 'Maybe'],
          nativeName: 'enum_ind_51d6e671dcb9db93bb8de6c453e975f8089d6535',
        },
        defaultValue: 'Yes',
      },
      createdAt: {
        type: {
          name: ColumnType.DATE,
        },
        meta: {
          alias: 'createdOn',
          capabilities: [ColumnCapability.CREATED_AT],
        },
      },
    },
    uniques: {
      id_and_smth: {
        columns: ['id', 'smth'],
        meta: {
          note: 'Some note on why we need this',
        },
      },
    },
    indexes: {
      comp_idx: {
        columns: ['createdAt', 'id'],
        type: IndexType.HASH,
      },
    },
    relations: {
      fk_my_table_user: {
        columns: ['id'],
        references: {
          table: 'users',
          columns: ['user_id'],
        },
        isLocalUnique: true,
        onDelete: ForeignAction.SET_NULL,
        onUpdate: ForeignAction.CASCADE,
        meta: {
          alias: 'user',
        },
      },
    },
  },
]);
```

### Why is this package exists?

My problem was very simple, I want the flexibility of a NoSQL database but I still want to have the relation management and the behaviors of a SQL database. Of course you could always just change the database tables with well written SQL statements, but I want my users to be able to add new columns or remove them as their needs change, but they don't have to learn to code well crafted migrations.

### How is this achieved?

Inductor reads the database to understand your current state, and then it compares it with the desired state to calculate what has to be done to achieve the given form. There is no magic in this, borring exceptions all over the place, schema diffentiations and basic translations.

For example you add a new "cart_value" column to your schema, inductor detects that the current table does not have this column and runs an alter table query to add it. The same goes for removing and changing.

Of course this is not a trivial deal, sometime there is a lot of analysis has to be done before the system can make the right decision, but the good side is, that as a programmer you had to go through those cases manually, and this system already understands complex changes like, you add a secondary primary key to your table, so it has to remove the old constraint which only contained a single column and create a new one with both column included.

### Database Support

At this moment only the PostgreSQL database is supported, over time I may add more adapters because we can simply abstract the functionalities with the ORM layer and ensure that even features which does not exists in one database, can be achieved with pre computation. But first the PG has to be covered to the maximum.

### PostgreSQL Implementation

---

Gonna track the implemented and missing features with all the generic capabilities.

- Create: Can create the feature from the schema
- Read: Can read the state from the database into a schema
- Update: Can modify the state
- Delete: Can remove the feature from the database

| Feature                     | Create | Read | Update | Delete |
| :-------------------------- | :----: | :--: | :----: | :----: |
| Columns                     |   Y    |  Y   |   Y    |   Y    |
| Nullable Columns            |   Y    |  Y   |   Y    |   Y    |
| Enumerated Columns          |   Y    |  Y   |   N    |   N    |
| Single Unique Constraint    |   Y    |  Y   |   Y    |   Y    |
| Composite Unique Constraint |   Y    |  Y   |   ?    |   ?    |
| Composite Foreign Key       |   Y    |  Y   |   N    |   N    |

### License

GPL v3.0
