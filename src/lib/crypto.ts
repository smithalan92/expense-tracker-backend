import * as bcrypt from 'bcrypt';

export function hash(text: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(text, salt);
}

export function isSame(text: string, hash: string): boolean {
  return bcrypt.compareSync(text, hash);
}
