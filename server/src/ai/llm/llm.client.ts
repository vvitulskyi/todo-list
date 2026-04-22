import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { LLMResponse } from './llm.types';

const endpoint = 'https://models.github.ai/inference';
const modelName = 'openai/gpt-4o-mini';

@Injectable()
export class LLMClient {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: endpoint,
      apiKey: process.env['GITHUB_TOKEN'],
    });
  }

  async chat(system: string, user: string): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    return { content: response.choices[0].message.content };
  }
}
