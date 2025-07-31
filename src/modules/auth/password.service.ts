import argon2 from "argon2";

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean>{
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}