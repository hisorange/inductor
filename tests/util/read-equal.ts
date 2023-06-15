import cloneDeep from 'lodash.clonedeep';
import { Inductor } from '../../src';
import { ITable } from '../../src/types/table.interface';

export const createToEqual = (driver: Inductor) => async (table: ITable) => {
  const state = cloneDeep(driver.state);
  state.tables = [table];

  await driver.set(state);

  const newState = (await driver.read([table.name])).tables[0];

  expect(table).toStrictEqual(newState);
};
