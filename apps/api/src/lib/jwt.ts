import jwt, { type SignOptions } from 'jsonwebtoken';
import { type TokenPayload } from '@hk26/schema';

// Get secrets dynamically to ensure .env is loaded
function getAccessSecret(): string {
  return process.env.JWT_ACCESS_SECRET || 'dev-secret-key';
}

function getRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key';
}

function getAccessExpiresIn(): string | number {
  return process.env.JWT_ACCESS_EXPIRES_IN || '15m';
}

function getRefreshExpiresIn(): string | number {
  return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: getAccessExpiresIn() } as SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: getRefreshExpiresIn() } as SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getAccessSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, getRefreshSecret()) as TokenPayload;
}
