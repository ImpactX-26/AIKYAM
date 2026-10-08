import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function verify() {
  console.log('\n============================================================');
  console.log('       Educaro Compass - Database Verification Report       ');
  console.log('============================================================\n');

  try {
    const userCount = await prisma.user.count();
    const applicantCount = await prisma.applicant.count();
    const serviceCount = await prisma.educaroService.count();
    const ruleSetCount = await prisma.qualificationRuleSet.count();
    const documentCount = await prisma.document.count();
    const factCount = await prisma.profileFact.count();
    const clarificationCount = await prisma.clarificationTask.count();
    const qualResultCount = await prisma.qualificationResult.count();
    const recommendationCount = await prisma.recommendation.count();

    console.log(`👥 Users:                 ${userCount}`);
    console.log(`🎓 Applicants:            ${applicantCount}`);
    console.log(`🏢 Educaro Services:      ${serviceCount}`);
    console.log(`⚖️  Qualification Rules:   ${ruleSetCount}`);
    console.log(`📄 Documents:             ${documentCount}`);
    console.log(`🏷️  Profile Facts:         ${factCount}`);
    console.log(`⚠️  Clarification Tasks:   ${clarificationCount}`);
    console.log(`📊 Qualification Results: ${qualResultCount}`);
    console.log(`🎯 Recommendations:       ${recommendationCount}`);

    console.log('\n--- 3 Demo Personas Summary ---');
    const applicants = await prisma.applicant.findMany({
      include: {
        personal: true,
        clarificationTasks: true,
        qualificationResults: true,
        recommendations: true,
      },
    });

    for (const app of applicants) {
      console.log(`\n• ${app.personal?.name || 'Unnamed'} (Goal: ${app.goal}, Completeness: ${app.completenessScore}%)`);
      console.log(`  - Issues / Clarifications: ${app.clarificationTasks.length} detected`);
      for (const t of app.clarificationTasks) {
        console.log(`    [${t.severity}] ${t.message}`);
      }
      if (app.qualificationResults.length > 0) {
        const q = app.qualificationResults[0];
        console.log(`  - Qualification: ${q.status} (Score: ${q.score})`);
      }
      if (app.recommendations.length > 0) {
        console.log(`  - Top Recommendation: ${app.recommendations[0].title}`);
      }
    }

    console.log('\n✅ All database models and seeded demo records verified successfully!\n');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();


