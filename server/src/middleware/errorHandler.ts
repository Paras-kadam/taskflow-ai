import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  }
  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  res.status(statusCode).json({
    message,
    stack: config.NODE_ENV === 'production' ? null : err.stack,
  });
};
