import { forwardRef, Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [forwardRef(() => TasksModule)],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
