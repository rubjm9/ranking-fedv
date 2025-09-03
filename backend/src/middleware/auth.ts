import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está configurado');
      return res.status(500).json({
        success: false,
        error: 'Error de configuración del servidor'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Verificar que el usuario existe en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que el usuario es admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    // Añadir información del usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      return next(); // Continuar sin usuario
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin usuario
    next();
  }
};

// Alias para compatibilidad
export const authenticateToken = authMiddleware;
