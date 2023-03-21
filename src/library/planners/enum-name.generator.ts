const sha1 = (str: string) => {
  const crypto = require('crypto');
  return crypto.createHash('sha1').update(str).digest('hex');
};

export const generateEnumName = (values: string[]) => {
  return (
    'enum_inductor_' +
    sha1(JSON.stringify(values.sort((a, b) => (a > b ? 1 : -1))))
  );
};
