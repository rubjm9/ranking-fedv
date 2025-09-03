import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario admin
  console.log('👤 Creando usuario administrador...');
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@fedv.es' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@fedv.es',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log(`✅ Usuario admin creado: ${adminUser.email}`);

  // Crear regiones
  console.log('🏛️ Creando regiones...');
  const regions = [
    { name: 'Andalucía', code: 'AND', coefficient: 1.0 },
    { name: 'Aragón', code: 'ARA', coefficient: 1.0 },
    { name: 'Asturias', code: 'AST', coefficient: 1.0 },
    { name: 'Baleares', code: 'BAL', coefficient: 1.0 },
    { name: 'Canarias', code: 'CAN', coefficient: 1.0 },
    { name: 'Cantabria', code: 'CAN', coefficient: 1.0 },
    { name: 'Castilla-La Mancha', code: 'CLM', coefficient: 1.0 },
    { name: 'Castilla y León', code: 'CYL', coefficient: 1.0 },
    { name: 'Cataluña', code: 'CAT', coefficient: 1.0 },
    { name: 'Extremadura', code: 'EXT', coefficient: 1.0 },
    { name: 'Galicia', code: 'GAL', coefficient: 1.0 },
    { name: 'La Rioja', code: 'RIO', coefficient: 1.0 },
    { name: 'Madrid', code: 'MAD', coefficient: 1.0 },
    { name: 'Murcia', code: 'MUR', coefficient: 1.0 },
    { name: 'Navarra', code: 'NAV', coefficient: 1.0 },
    { name: 'País Vasco', code: 'PV', coefficient: 1.0 },
    { name: 'Valencia', code: 'VAL', coefficient: 1.0 }
  ];

  const createdRegions = [];
  for (const regionData of regions) {
    const region = await prisma.region.upsert({
      where: { code: regionData.code },
      update: {},
      create: regionData
    });
    createdRegions.push(region);
  }

  console.log(`✅ ${createdRegions.length} regiones creadas`);

  // Crear equipos de ejemplo
  console.log('🏆 Creando equipos de ejemplo...');
  const teams = [
    // Andalucía
    { name: 'Sevilla Ultimate', club: 'Sevilla Ultimate Club', regionCode: 'AND' },
    { name: 'Málaga Frisbee', club: 'Málaga Frisbee Club', regionCode: 'AND' },
    { name: 'Granada Flying Disc', club: 'Granada Flying Disc', regionCode: 'AND' },
    
    // Cataluña
    { name: 'Barcelona Ultimate', club: 'Barcelona Ultimate Club', regionCode: 'CAT' },
    { name: 'Girona Frisbee', club: 'Girona Frisbee Club', regionCode: 'CAT' },
    { name: 'Lleida Flying Disc', club: 'Lleida Flying Disc', regionCode: 'CAT' },
    
    // Madrid
    { name: 'Madrid Ultimate', club: 'Madrid Ultimate Club', regionCode: 'MAD' },
    { name: 'Alcalá Frisbee', club: 'Alcalá Frisbee Club', regionCode: 'MAD' },
    { name: 'Getafe Flying Disc', club: 'Getafe Flying Disc', regionCode: 'MAD' },
    
    // Valencia
    { name: 'Valencia Ultimate', club: 'Valencia Ultimate Club', regionCode: 'VAL' },
    { name: 'Alicante Frisbee', club: 'Alicante Frisbee Club', regionCode: 'VAL' },
    { name: 'Castellón Flying Disc', club: 'Castellón Flying Disc', regionCode: 'VAL' },
    
    // País Vasco
    { name: 'Bilbao Ultimate', club: 'Bilbao Ultimate Club', regionCode: 'PV' },
    { name: 'Vitoria Frisbee', club: 'Vitoria Frisbee Club', regionCode: 'PV' },
    { name: 'San Sebastián Flying Disc', club: 'San Sebastián Flying Disc', regionCode: 'PV' },
    
    // Galicia
    { name: 'Santiago Ultimate', club: 'Santiago Ultimate Club', regionCode: 'GAL' },
    { name: 'Vigo Frisbee', club: 'Vigo Frisbee Club', regionCode: 'GAL' },
    { name: 'A Coruña Flying Disc', club: 'A Coruña Flying Disc', regionCode: 'GAL' },
    
    // Aragón
    { name: 'Zaragoza Ultimate', club: 'Zaragoza Ultimate Club', regionCode: 'ARA' },
    { name: 'Huesca Frisbee', club: 'Huesca Frisbee Club', regionCode: 'ARA' },
    { name: 'Teruel Flying Disc', club: 'Teruel Flying Disc', regionCode: 'ARA' }
  ];

  const createdTeams = [];
  for (const teamData of teams) {
    const region = createdRegions.find(r => r.code === teamData.regionCode);
    if (region) {
      // Verificar si el equipo ya existe
      const existingTeam = await prisma.team.findFirst({
        where: { name: teamData.name }
      });

      if (!existingTeam) {
        const team = await prisma.team.create({
          data: {
            name: teamData.name,
            club: teamData.club,
            regionId: region.id,
            email: `${teamData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
          }
        });
        createdTeams.push(team);
      } else {
        createdTeams.push(existingTeam);
      }
    }
  }

  console.log(`✅ ${createdTeams.length} equipos creados`);

  // Crear torneos de ejemplo
  console.log('🏟️ Creando torneos de ejemplo...');
  const tournaments = [
    // CE1 2024
    {
      name: 'Campeonato de España 1ª División 2024',
      type: 'CE1',
      year: 2024,
      surface: 'GRASS',
      modality: 'OPEN'
    },
    // CE2 2024
    {
      name: 'Campeonato de España 2ª División 2024',
      type: 'CE2',
      year: 2024,
      surface: 'GRASS',
      modality: 'OPEN'
    },
    // Regionales 2024
    {
      name: 'Campeonato Regional Andalucía 2024',
      type: 'REGIONAL',
      year: 2024,
      surface: 'GRASS',
      modality: 'OPEN',
      regionCode: 'AND'
    },
    {
      name: 'Campeonato Regional Cataluña 2024',
      type: 'REGIONAL',
      year: 2024,
      surface: 'GRASS',
      modality: 'OPEN',
      regionCode: 'CAT'
    },
    {
      name: 'Campeonato Regional Madrid 2024',
      type: 'REGIONAL',
      year: 2024,
      surface: 'GRASS',
      modality: 'OPEN',
      regionCode: 'MAD'
    },
    // CE1 2023
    {
      name: 'Campeonato de España 1ª División 2023',
      type: 'CE1',
      year: 2023,
      surface: 'GRASS',
      modality: 'OPEN'
    },
    // CE2 2023
    {
      name: 'Campeonato de España 2ª División 2023',
      type: 'CE2',
      year: 2023,
      surface: 'GRASS',
      modality: 'OPEN'
    },
    // Regionales 2023
    {
      name: 'Campeonato Regional Andalucía 2023',
      type: 'REGIONAL',
      year: 2023,
      surface: 'GRASS',
      modality: 'OPEN',
      regionCode: 'AND'
    },
    {
      name: 'Campeonato Regional Cataluña 2023',
      type: 'REGIONAL',
      year: 2023,
      surface: 'GRASS',
      modality: 'OPEN',
      regionCode: 'CAT'
    },
    {
      name: 'Campeonato Regional Madrid 2023',
      type: 'REGIONAL',
      year: 2023,
      surface: 'GRASS',
      modality: 'OPEN',
      regionCode: 'MAD'
    }
  ];

  const createdTournaments = [];
  for (const tournamentData of tournaments) {
    const region = tournamentData.regionCode 
      ? createdRegions.find(r => r.code === tournamentData.regionCode)
      : null;

    const tournament = await prisma.tournament.upsert({
      where: { 
        name_year: {
          name: tournamentData.name,
          year: tournamentData.year
        }
      },
      update: {},
      create: {
        name: tournamentData.name,
        type: tournamentData.type as any,
        year: tournamentData.year,
        surface: tournamentData.surface as any,
        modality: tournamentData.modality as any,
        regionId: region?.id
      }
    });
    createdTournaments.push(tournament);
  }

  console.log(`✅ ${createdTournaments.length} torneos creados`);

  // Crear posiciones de ejemplo
  console.log('📊 Creando posiciones de ejemplo...');
  
  // Posiciones para CE1 2024
  const ce1_2024 = createdTournaments.find(t => t.name.includes('CE1') && t.year === 2024);
  if (ce1_2024) {
    const ce1Teams = createdTeams.slice(0, 12); // Top 12 equipos
    for (let i = 0; i < ce1Teams.length; i++) {
      await prisma.position.upsert({
        where: {
          teamId_tournamentId: {
            teamId: ce1Teams[i].id,
            tournamentId: ce1_2024.id
          }
        },
        update: {},
        create: {
          teamId: ce1Teams[i].id,
          tournamentId: ce1_2024.id,
          position: i + 1
        }
      });
    }
  }

  // Posiciones para CE2 2024
  const ce2_2024 = createdTournaments.find(t => t.name.includes('CE2') && t.year === 2024);
  if (ce2_2024) {
    const ce2Teams = createdTeams.slice(12, 24); // Siguientes 12 equipos
    for (let i = 0; i < ce2Teams.length; i++) {
      await prisma.position.upsert({
        where: {
          teamId_tournamentId: {
            teamId: ce2Teams[i].id,
            tournamentId: ce2_2024.id
          }
        },
        update: {},
        create: {
          teamId: ce2Teams[i].id,
          tournamentId: ce2_2024.id,
          position: i + 1
        }
      });
    }
  }

  // Posiciones para regionales 2024
  const regionalTournaments2024 = createdTournaments.filter(t => 
    t.type === 'REGIONAL' && t.year === 2024
  );

  for (const tournament of regionalTournaments2024) {
    const regionTeams = createdTeams.filter(t => 
      createdRegions.find(r => r.id === t.regionId)?.code === 
      createdRegions.find(r => r.id === tournament.regionId)?.code
    ).slice(0, 8); // Top 8 equipos por región

    for (let i = 0; i < regionTeams.length; i++) {
      await prisma.position.upsert({
        where: {
          teamId_tournamentId: {
            teamId: regionTeams[i].id,
            tournamentId: tournament.id
          }
        },
        update: {},
        create: {
          teamId: regionTeams[i].id,
          tournamentId: tournament.id,
          position: i + 1
        }
      });
    }
  }

  // Posiciones para 2023 (similar estructura)
  const ce1_2023 = createdTournaments.find(t => t.name.includes('CE1') && t.year === 2023);
  if (ce1_2023) {
    const ce1Teams2023 = createdTeams.slice(0, 12);
    for (let i = 0; i < ce1Teams2023.length; i++) {
      await prisma.position.upsert({
        where: {
          teamId_tournamentId: {
            teamId: ce1Teams2023[i].id,
            tournamentId: ce1_2023.id
          }
        },
        update: {},
        create: {
          teamId: ce1Teams2023[i].id,
          tournamentId: ce1_2023.id,
          position: i + 1
        }
      });
    }
  }

  const ce2_2023 = createdTournaments.find(t => t.name.includes('CE2') && t.year === 2023);
  if (ce2_2023) {
    const ce2Teams2023 = createdTeams.slice(12, 24);
    for (let i = 0; i < ce2Teams2023.length; i++) {
      await prisma.position.upsert({
        where: {
          teamId_tournamentId: {
            teamId: ce2Teams2023[i].id,
            tournamentId: ce2_2023.id
          }
        },
        update: {},
        create: {
          teamId: ce2Teams2023[i].id,
          tournamentId: ce2_2023.id,
          position: i + 1
        }
      });
    }
  }

  const regionalTournaments2023 = createdTournaments.filter(t => 
    t.type === 'REGIONAL' && t.year === 2023
  );

  for (const tournament of regionalTournaments2023) {
    const regionTeams = createdTeams.filter(t => 
      createdRegions.find(r => r.id === t.regionId)?.code === 
      createdRegions.find(r => r.id === tournament.regionId)?.code
    ).slice(0, 8);

    for (let i = 0; i < regionTeams.length; i++) {
      await prisma.position.upsert({
        where: {
          teamId_tournamentId: {
            teamId: regionTeams[i].id,
            tournamentId: tournament.id
          }
        },
        update: {},
        create: {
          teamId: regionTeams[i].id,
          tournamentId: tournament.id,
          position: i + 1
        }
      });
    }
  }

  console.log('✅ Posiciones creadas');

  // Crear configuración por defecto
  console.log('⚙️ Creando configuración por defecto...');
  const defaultConfig = {
    ce1Points: {
      1: 1000, 2: 850, 3: 725, 4: 625, 5: 520, 6: 450, 7: 380, 8: 320,
      9: 270, 10: 230, 11: 195, 12: 165, 13: 140, 14: 120, 15: 105, 16: 90,
      17: 75, 18: 65, 19: 55, 20: 46, 21: 39, 22: 34, 23: 30, 24: 27
    },
    ce2Points: {
      1: 230, 2: 195, 3: 165, 4: 140, 5: 120, 6: 103, 7: 86, 8: 74,
      9: 63, 10: 54, 11: 46, 12: 39, 13: 34, 14: 29, 15: 25, 16: 21,
      17: 18, 18: 15, 19: 13, 20: 11, 21: 9, 22: 8, 23: 7, 24: 6
    },
    regionalPoints: {
      1: 140, 2: 120, 3: 100, 4: 85, 5: 72, 6: 60, 7: 50, 8: 42,
      9: 35, 10: 30, 11: 25, 12: 21, 13: 18, 14: 15, 15: 13, 16: 11,
      17: 9, 18: 8, 19: 7, 20: 6, 21: 5, 22: 4, 23: 3, 24: 2
    },
    temporalWeights: {
      0: 1.0,  // Año actual
      1: 0.8,  // Año -1
      2: 0.5,  // Año -2
      3: 0.2   // Año -3
    },
    regionalCoefficient: {
      floor: 0.8,
      ceiling: 1.2,
      increment: 0.01
    }
  };

  await prisma.configuration.upsert({
    where: { key: 'ranking_config' },
    update: {},
    create: {
      key: 'ranking_config',
      value: JSON.stringify(defaultConfig)
    }
  });

  console.log('✅ Configuración por defecto creada');

  console.log('🎉 Seed completado exitosamente!');
  console.log(`📊 Resumen:`);
  console.log(`   - ${createdRegions.length} regiones`);
  console.log(`   - ${createdTeams.length} equipos`);
  console.log(`   - ${createdTournaments.length} torneos`);
  console.log(`   - Usuario admin: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
