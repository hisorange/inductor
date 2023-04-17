import { genSaltSync, hashSync } from 'bcrypt';
import { IColumnHook } from '../types/column-hook.interface';

export const PasswordHook: IColumnHook = {
  onWrite: (plain: string): string =>
    plain ? hashSync(plain, genSaltSync(4)) : plain,
};
