import EventEmitter2 from 'eventemitter2';
import pino from 'pino';
import { v4 } from 'uuid';
import { MySQLDriver } from './driver/mysql/mysql.driver';
import { PostgresDriver } from './driver/postgres/postgres.driver';
import { UnsupportedProvider } from './exception';
import { IDatabase, IDriver } from './interface';
import { DatabaseProvider } from './interface/database/database.provider';

export function createDriver(database: IDatabase): IDriver {
  const id = v4().substring(0, 8);
  const logger = pino({
    name: `inductor.${id}`,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    enabled: process.env.NODE_ENV !== 'test',
  });
  const eventEmitter = new EventEmitter2();

  switch (database.provider) {
    case DatabaseProvider.POSTGRES:
      return new PostgresDriver(
        id,
        logger,
        database as IDatabase<DatabaseProvider.POSTGRES>,
        eventEmitter,
      );
    case DatabaseProvider.MYSQL:
      return new MySQLDriver(id, logger, database, eventEmitter);
    default:
      throw new UnsupportedProvider(database.provider);
  }
}
