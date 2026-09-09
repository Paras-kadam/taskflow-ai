import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config/env';

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
};

export const setTokenCookie = (res: Response, token: string): void => {
  const isProduction = config.NODE_ENV === 'production';
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearTokenCookie = (res: Response): void => {
  const isProduction = config.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    expires: new Date(0),
  });
};
