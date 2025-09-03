import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor';

  // Log del error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Manejar errores específicos de Prisma
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Conflicto: El registro ya existe';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Registro no encontrado';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Error de referencia: Datos relacionados no válidos';
        break;
      default:
        statusCode = 400;
        message = 'Error en la base de datos';
    }
  }

  // Manejar errores de validación
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación: ' + error.message;
  }

  // Manejar errores de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Manejar errores de sintaxis JSON
  if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'JSON inválido en el cuerpo de la petición';
  }

  // En desarrollo, incluir stack trace
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Middleware para capturar errores asíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores personalizados
export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

// Errores comunes
export const Errors = {
  NOT_FOUND: (resource: string = 'Recurso') => 
    createError(`${resource} no encontrado`, 404),
  
  UNAUTHORIZED: (message: string = 'No autorizado') => 
    createError(message, 401),
  
  FORBIDDEN: (message: string = 'Acceso denegado') => 
    createError(message, 403),
  
  BAD_REQUEST: (message: string = 'Solicitud incorrecta') => 
    createError(message, 400),
  
  CONFLICT: (message: string = 'Conflicto de datos') => 
    createError(message, 409),
  
  VALIDATION_ERROR: (message: string = 'Error de validación') => 
    createError(message, 400),
  
  INTERNAL_SERVER: (message: string = 'Error interno del servidor') => 
    createError(message, 500)
};
