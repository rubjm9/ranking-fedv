import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Configurar base de datos de test si es necesario
  console.log('🧪 Configurando entorno de tests...');
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpiar datos de test si es necesario
});

afterEach(async () => {
  // Limpiar después de cada test
});
