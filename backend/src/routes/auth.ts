import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, Errors } from '@/middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

/**
 * POST /api/auth/login
 * Login de administrador
 */
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  console.log('Login request received:', {
    body: req.body,
    headers: req.headers['content-type'],
    method: req.method,
    url: req.url
  });
  
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    throw Errors.VALIDATION_ERROR(errors.array()[0].msg);
  }

  const { email, password } = req.body;
  console.log('Extracted credentials:', { email, password });

  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw Errors.UNAUTHORIZED('Credenciales inválidas');
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw Errors.UNAUTHORIZED('Credenciales inválidas');
  }

  // Verificar que el usuario es admin
  if (user.role !== 'ADMIN') {
    throw Errors.FORBIDDEN('Acceso denegado. Se requieren permisos de administrador');
  }

  // Generar token JWT
  if (!process.env.JWT_SECRET) {
    throw Errors.INTERNAL_SERVER('Error de configuración del servidor');
  }

  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Crear log de auditoría
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      resource: 'AUTH',
      details: JSON.stringify({
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    },
    message: 'Login exitoso'
  });
}));

/**
 * POST /api/auth/verify
 * Verificar token JWT
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw Errors.BAD_REQUEST('Token requerido');
  }

  if (!process.env.JWT_SECRET) {
    throw Errors.INTERNAL_SERVER('Error de configuración del servidor');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw Errors.UNAUTHORIZED('Usuario no encontrado');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      message: 'Token válido'
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw Errors.UNAUTHORIZED('Token inválido');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw Errors.UNAUTHORIZED('Token expirado');
    }
    throw error;
  }
}));

/**
 * POST /api/auth/logout
 * Logout (opcional, para auditoría)
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (userId) {
    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        resource: 'AUTH',
        details: JSON.stringify({
          timestamp: new Date().toISOString()
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
  }

  res.json({
    success: true,
    message: 'Logout exitoso'
  });
}));

export default router;
