import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import dotenv from 'dotenv';

dotenv.config();

const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(400, message);
};

export const handleDuplicateFieldsDB = (err: any): AppError => {
  const fields = Object.keys(err.fields ?? {}).map((field) =>
    field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase(),
  );
  const duplicate = fields.length ? fields.join(' and ') : 'value';
  const message = fields.length
    ? `The ${duplicate} is already in use. Please use another ${duplicate}.`
    : 'This value is already in use. Please use another value.';
  return new AppError(409, message);
};

const handleValidationErrorDB = (err: any): AppError => {
  console.log(err);
  const errors = Object.values(err.errors).map((el: any) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(400, message);
};

const handleJWTError = (): AppError =>
  new AppError(401, 'Invalid token. Please log in again!');

const handleJWTExpiredError = (): AppError =>
  new AppError(401, 'Your token has expired! Please log in again.');

const handleURIError = (): AppError =>
  new AppError(400, 'Invalid URL. The request contains malformed characters.');

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err instanceof URIError || err.name === 'URIError')
    err = handleURIError();

  if (process.env.NODE_ENV?.trim() === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV?.trim() === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.name === 'SequelizeUniqueConstraintError')
      err = handleDuplicateFieldsDB(err);
    if (err.name === 'Validation error') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
    sendErrorProd(err, res);
  } else {
    sendErrorProd(err, res);
  }
};
export default errorHandler;
