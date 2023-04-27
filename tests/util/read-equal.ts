import { Inductor } from '../../src';
import { ITable } from '../../src/types/table.interface';

export const createToEqual = (driver: Inductor) => async (table: ITable) => {
  await driver.set([table]);
  expect((await driver.read([table.name]))[0]).toStrictEqual(table);
};
