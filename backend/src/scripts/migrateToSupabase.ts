import { PrismaClient } from '@prisma/client';
import { supabaseAdmin } from '../services/supabaseService';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function migrateToSupabase() {
  try {
    console.log('🚀 Iniciando migración a Supabase...');

    // Verificar conexión a Supabase
    const { data, error } = await supabaseAdmin.from('regions').select('count').limit(1);
    if (error) {
      console.error('❌ Error conectando a Supabase:', error);
      return;
    }
    console.log('✅ Conexión a Supabase establecida');

    // Migrar regiones
    console.log('📦 Migrando regiones...');
    const regions = await prisma.region.findMany();
    for (const region of regions) {
      const { error } = await supabaseAdmin
        .from('regions')
        .upsert({
          id: region.id,
          name: region.name,
          coefficient: region.coefficient,
          floor: region.floor,
          ceiling: region.ceiling,
          increment: region.increment,
          created_at: region.createdAt.toISOString(),
          updated_at: region.updatedAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando región ${region.name}:`, error);
      } else {
        console.log(`✅ Región migrada: ${region.name}`);
      }
    }

    // Migrar equipos
    console.log('📦 Migrando equipos...');
    const teams = await prisma.team.findMany();
    for (const team of teams) {
      const { error } = await supabaseAdmin
        .from('teams')
        .upsert({
          id: team.id,
          name: team.name,
          region_id: team.regionId,
          email: team.email,
          logo: team.logo,
          is_filial: team.isFilial,
          parent_team_id: team.parentTeamId,
          has_different_names: team.hasDifferentNames,
          name_open: team.nameOpen,
          name_women: team.nameWomen,
          name_mixed: team.nameMixed,
          created_at: team.createdAt.toISOString(),
          updated_at: team.updatedAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando equipo ${team.name}:`, error);
      } else {
        console.log(`✅ Equipo migrado: ${team.name}`);
      }
    }

    // Migrar torneos
    console.log('📦 Migrando torneos...');
    const tournaments = await prisma.tournament.findMany();
    for (const tournament of tournaments) {
      const { error } = await supabaseAdmin
        .from('tournaments')
        .upsert({
          id: tournament.id,
          name: tournament.name,
          type: tournament.type,
          year: tournament.year,
          surface: tournament.surface,
          modality: tournament.modality,
          region_id: tournament.regionId,
          start_date: tournament.startDate?.toISOString(),
          end_date: tournament.endDate?.toISOString(),
          location: tournament.location,
          created_at: tournament.createdAt.toISOString(),
          updated_at: tournament.updatedAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando torneo ${tournament.name}:`, error);
      } else {
        console.log(`✅ Torneo migrado: ${tournament.name}`);
      }
    }

    // Migrar posiciones
    console.log('📦 Migrando posiciones...');
    const positions = await prisma.position.findMany();
    for (const position of positions) {
      const { error } = await supabaseAdmin
        .from('positions')
        .upsert({
          id: position.id,
          position: position.position,
          points: position.points,
          team_id: position.teamId,
          tournament_id: position.tournamentId,
          created_at: position.createdAt.toISOString(),
          updated_at: position.updatedAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando posición ${position.id}:`, error);
      } else {
        console.log(`✅ Posición migrada: ${position.id}`);
      }
    }

    // Migrar historial de ranking
    console.log('📦 Migrando historial de ranking...');
    const rankingHistory = await prisma.rankingHistory.findMany();
    for (const history of rankingHistory) {
      const { error } = await supabaseAdmin
        .from('ranking_history')
        .upsert({
          id: history.id,
          team_id: history.teamId,
          year: history.year,
          points: history.points,
          rank: history.rank,
          details: history.details,
          created_at: history.createdAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando historial ${history.id}:`, error);
      } else {
        console.log(`✅ Historial migrado: ${history.id}`);
      }
    }

    // Migrar configuraciones
    console.log('📦 Migrando configuraciones...');
    const configurations = await prisma.configuration.findMany();
    for (const config of configurations) {
      const { error } = await supabaseAdmin
        .from('configurations')
        .upsert({
          id: config.id,
          key: config.key,
          value: config.value,
          created_at: config.createdAt.toISOString(),
          updated_at: config.updatedAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando configuración ${config.key}:`, error);
      } else {
        console.log(`✅ Configuración migrada: ${config.key}`);
      }
    }

    // Migrar usuarios
    console.log('📦 Migrando usuarios...');
    const users = await prisma.user.findMany();
    for (const user of users) {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          password: user.password,
          role: user.role,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString()
        });
      
      if (error) {
        console.error(`❌ Error migrando usuario ${user.email}:`, error);
      } else {
        console.log(`✅ Usuario migrado: ${user.email}`);
      }
    }

    console.log('🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateToSupabase();
}

export default migrateToSupabase;
