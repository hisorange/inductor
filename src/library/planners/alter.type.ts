import { NotImplemented } from '../../exception/not-implemented.exception';

export const alterType = () => {
  //   if (columnDefinition.type.name === ColumnType.ENUM) {
  //     // Changing enum values
  //     if (path[3] === 'values') {
  //       // Check if the native type already exists
  //       if (
  //         this.ctx.reflection.isTypeExists(
  //           columnDefinition.type.nativeName,
  //         )
  //       ) {
  //         // Need to check if the values are the same
  //         // Rename the type if not connected to other tables
  //         // Fail if so
  //         // Then create the new type and use the old name
  //         // And after it's created we can drop the old one
  //       }
  //     }
  //   }

  throw new NotImplemented(`Column alteration for [type] is not implemented`);
};
