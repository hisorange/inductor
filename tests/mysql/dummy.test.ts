import { Inductor } from '../../src';
import { createMySQLTestInstance } from './util/create-test-instance.mysql';

describe('[MySQL] Dummy', () => {
  const inductor = createMySQLTestInstance();

  test('should run', () => {
    expect(inductor).toBeInstanceOf(Inductor);
  });
});
