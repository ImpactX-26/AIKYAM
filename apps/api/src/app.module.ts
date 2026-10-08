import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { StorageModule } from './storage/storage.module';
import { LlmModule } from './llm/llm.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MediaModule } from './modules/media/media.module';
import { ValidationModule } from './modules/validation/validation.module';
import { QualificationModule } from './modules/qualification/qualification.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { CvModule } from './modules/cv/cv.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    StorageModule,
    LlmModule,
    AgentsModule,
    AuthModule,
    ProfileModule,
    ConversationsModule,
    DocumentsModule,
    MediaModule,
    ValidationModule,
    QualificationModule,
    RecommendationsModule,
    CvModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
