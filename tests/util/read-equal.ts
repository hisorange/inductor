import cloneDeep from 'lodash.clonedeep';
import { Inductor } from '../../src';
import { ITable } from '../../src/types/table.interface';

export const createToEqual = (driver: Inductor) => async (table: ITable) => {
  const state = cloneDeep(driver.database);
  state.tables = [table];

  await driver.set(state);
  expect((await driver.read([table.name])).tables[0]).toStrictEqual(table);
};
