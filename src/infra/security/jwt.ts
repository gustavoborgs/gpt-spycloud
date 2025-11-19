import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  userId: string;
  tenantId?: string;
  email?: string;
}

export class JWT {
  static sign(payload: JwtPayload, expiresIn: string | number = '7d'): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
  }

  static verify(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  }

  static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}

