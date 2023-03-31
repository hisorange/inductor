import { NotImplemented } from '../../exception/not-implemented.exception';
import { IChange } from '../../types/change.interface';
import { IColumn } from '../../types/column.interface';
import { alterComments } from './alter.comments';
import { alterDefaultValue } from './alter.default-value';
import { alterIndex } from './alter.index';
import { alterNullable } from './alter.nullable';
import { alterType } from './alter.type';
import { alterUnique } from './alter.unique';

export const alterColumn = async (
  change: IChange,
  key: keyof IColumn,
  name: string,
  definition: IColumn,
) => {
  switch (key) {
    case 'alias':
    case 'capabilities':
      alterComments(change, name);
      break;
    case 'isPrimary':
      change.isPrimaryChanged = true;
      break;
    case 'isNullable':
      alterNullable(change, name, definition);
      break;
    case 'isUnique':
      alterUnique(change, name, definition);
      break;
    case 'isIndexed':
      alterIndex();
      break;
    case 'defaultValue':
      alterDefaultValue(change, name, definition);
      break;
    case 'type':
      alterType();
      break;
    default:
      throw new NotImplemented(
        `Column alteration for [${key}] is not implemented`,
      );
  }
};
