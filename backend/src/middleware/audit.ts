import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;
  const startTime = Date.now();

  // Interceptar la respuesta para capturar el status code
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Crear log de auditoría de forma asíncrona (no bloquear la respuesta)
    createAuditLog(req, res, duration).catch(console.error);
    
    return originalSend.call(this, data);
  };

  next();
};

async function createAuditLog(req: Request, res: Response, duration: number) {
  try {
    const userId = req.user?.id;
    const action = getActionFromRequest(req);
    const resource = getResourceFromRequest(req);
    const resourceId = getResourceIdFromRequest(req);
    
    const details = JSON.stringify({
      method: req.method,
      url: req.url,
      duration,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
  } catch (error) {
    console.error('Error al crear log de auditoría:', error);
  }
}

function getActionFromRequest(req: Request): string {
  const method = req.method;
  const path = req.path;

  switch (method) {
    case 'GET':
      return 'READ';
    case 'POST':
      if (path.includes('/login')) return 'LOGIN';
      if (path.includes('/recalculate')) return 'RECALCULATE_RANKING';
      if (path.includes('/import')) return 'IMPORT_DATA';
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
}

function getResourceFromRequest(req: Request): string {
  const path = req.path;
  
  if (path.includes('/teams')) return 'TEAM';
  if (path.includes('/regions')) return 'REGION';
  if (path.includes('/tournaments')) return 'TOURNAMENT';
  if (path.includes('/ranking')) return 'RANKING';
  if (path.includes('/configuration')) return 'CONFIGURATION';
  if (path.includes('/import')) return 'IMPORT';
  if (path.includes('/export')) return 'EXPORT';
  if (path.includes('/auth')) return 'AUTH';
  
  return 'UNKNOWN';
}

function getResourceIdFromRequest(req: Request): string | undefined {
  // Extraer ID de la URL si existe
  const pathParts = req.path.split('/');
  const idIndex = pathParts.findIndex(part => part === 'id' || part.match(/^[a-zA-Z0-9-]+$/));
  
  if (idIndex !== -1 && idIndex < pathParts.length - 1) {
    return pathParts[idIndex + 1];
  }
  
  return undefined;
}

function sanitizeBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  
  // Remover campos sensibles
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Middleware específico para operaciones críticas
export const criticalOperationAudit = (operation: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: operation,
          resource: 'SYSTEM',
          details: JSON.stringify({
            operation,
            timestamp: new Date().toISOString(),
            user: req.user?.email,
            ip: req.ip
          }),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      next();
    } catch (error) {
      console.error('Error en auditoría de operación crítica:', error);
      next(); // Continuar aunque falle la auditoría
    }
  };
};
