import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Importar rutas
import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import regionRoutes from './routes/regions';
import tournamentRoutes from './routes/tournaments';
import rankingRoutes from './routes/ranking';
import importExportRoutes from './routes/importExport';
import configurationRoutes from './routes/configuration';

// Importar middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';

// Configurar variables de entorno
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configuración del puerto
const PORT = process.env.PORT || 3001;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
  }
});

// Middleware de seguridad y configuración
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Aplicar rate limiting a todas las rutas
app.use(limiter);

// Middleware de auditoría para rutas admin
app.use('/api/admin', auditMiddleware);

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/import', importExportRoutes);

// Rutas protegidas (admin)
app.use('/api/admin/configuration', authMiddleware, configurationRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API del Ranking FEDV - Ultimate Frisbee España',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      teams: '/api/teams',
      regions: '/api/regions',
      tournaments: '/api/tournaments',
      ranking: '/api/ranking',
      importExport: '/api/import-export',
      admin: '/api/admin'
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📊 API disponible en http://localhost:${PORT}`);
      console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();
