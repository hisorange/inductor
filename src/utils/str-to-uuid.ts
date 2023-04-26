import { createHash } from 'crypto';

export const toUUID = (name: string): string => {
  const id = createHash('sha1').update(name).digest('hex');
  // Format to match the UUID format
  return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(
    12,
    16,
  )}-${id.substring(16, 20)}-${id.substring(20, 32)}`;
};
