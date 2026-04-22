import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { LLMClient } from './llm/llm.client';

@Module({
  imports: [TasksModule, EmbeddingModule],
  controllers: [AiController],
  providers: [AiService, LLMClient],
  exports: [AiService],
})
export class AiModule {}
