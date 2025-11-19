import bcrypt from 'bcryptjs';

export class Hash {
  static async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, 10);
  }

  static async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}

