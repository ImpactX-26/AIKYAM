import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from workspace root or apps/api
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function maskUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return rawUrl.replace(/:([^@:]+)@/, ':****@');
  }
}

async function checkDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  console.log('\n============================================================');
  console.log('       Educaro Compass - Database Connectivity Check        ');
  console.log('============================================================\n');

  if (!dbUrl || dbUrl.trim() === '') {
    console.error('❌ ERROR: DATABASE_URL is not configured in your environment or .env file.\n');
    console.error('👉 HOW TO RESOLVE:');
    console.error('1. Copy .env.example to .env at the root of the project:');
    console.error('   cp .env.example .env (or copy .env.example .env in PowerShell)\n');
    console.error('2. Choose ONE of the following options:');
    console.error('   A) Hosted Free Cloud Postgres (Neon / Supabase - Recommended for Hackathons):');
    console.error('      Sign up at https://neon.tech or https://supabase.com');
    console.error('      Set DATABASE_URL="postgresql://user:pass@ep-pooler.region.neon.tech/neondb?sslmode=require"\n');
    console.error('   B) Local PostgreSQL (Windows / Mac / Linux):');
    console.error('      Set DATABASE_URL="postgresql://postgres:your_password@localhost:5432/educaro_compass?schema=public"\n');
    process.exit(1);
  }

  console.log(`ℹ️  Checking connection to: ${maskUrl(dbUrl)}`);

  const prisma = new PrismaClient();

  try {
    const startTime = Date.now();
    // Test basic query
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version();`;
    const latency = Date.now() - startTime;

    console.log('\n✅ Database connection SUCCESSFUL!');
    console.log(`⏱️  Latency: ${latency} ms`);
    if (result && result.length > 0) {
      const versionLine = result[0].version.split('\n')[0];
      console.log(`🐘 Engine: ${versionLine}`);
    }
    console.log('\nReady for migrations and seeding.\n');
  } catch (error: any) {
    console.error('\n❌ FAILED TO CONNECT TO POSTGRESQL:\n');
    console.error(error.message || error);
    console.error('\n👉 TROUBLESHOOTING TIPS:');
    console.error('- Ensure PostgreSQL is running (e.g. Get-Service *postgres* or local service)');
    console.error('- Verify the username, password, host, and port in DATABASE_URL');
    console.error('- Ensure the target database exists (e.g., CREATE DATABASE educaro_compass;)');
    console.error('- If using Neon/Supabase, make sure your IP has access or SSL is enabled (?sslmode=require)\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
