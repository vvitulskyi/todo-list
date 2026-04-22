import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { Task } from '../../tasks/dto/TaskResponse.dto';

const endpoint = 'https://models.github.ai/inference';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: endpoint,
      apiKey: process.env['GITHUB_TOKEN'],
    });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'openai/text-embedding-3-small',
      input: text,
    });

    this.logger.debug(`Embedded text (${text.length} chars)`);
    return response.data[0].embedding;
  }

  buildText(task: Task): string {
    const dueDate = task.dueDate ?? '';
    return `Title: ${task.title}\nDescription: ${task.description ?? ''}\nPriority: ${task.priority}\nDueDate: ${dueDate}`;
  }
}
