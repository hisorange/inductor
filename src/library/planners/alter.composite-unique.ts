import { Operation } from 'just-diff';
import { IChange } from '../../types/change.interface';
import { addCompositeUnique } from './add.composite-unique';
import { dropCompositeUnique } from './drop.composite-unique';

export const alterCompositeUnique = async (
  change: IChange,
  op: Operation,
  name: string,
) => {
  switch (op) {
    // New unique added
    case 'add':
      addCompositeUnique(change, name);
      break;

    // Unique removed
    case 'remove':
      dropCompositeUnique(change, name);
      break;
  }
};
