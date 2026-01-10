import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createAgent, ReactAgent, SystemMessage } from 'langchain';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { LangChainToolsService } from './langchain.tools';
import { threadId } from 'worker_threads';
import { systemInstruction } from './types';

@Injectable()
export class AgentService {
  private agent: ReactAgent;

  constructor(
    readonly configService: ConfigService,
    readonly langChainToolsService: LangChainToolsService,
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('GOOGLE_API_KEY');
    const dbUri = this.configService.getOrThrow<string>('DB_URI');

    // 1. Initialize Model
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: apiKey,
    });
    // 2. Initialize Vector Store
    const checkpointer = PostgresSaver.fromConnString(dbUri);
    await checkpointer.setup();
    const tools = await this.langChainToolsService.createTools();
    this.agent = createAgent({
      model: model,
      tools: tools,
      checkpointer: checkpointer,
      systemPrompt: new SystemMessage(
        'You are an AI assistant that helps users manage and query their timetables effectively. Use the provided tools to fetch and manipulate timetable data as needed. Always prioritize user privacy and data security.',
      ),
    });
  }

  async Startconversation(options: {
    // input: Record<string, unknown> ;
    //  command: Record<string, unknown>;
    //  config: LangGraphRunnableConfig;
  }) {
    return this.agent.stream(
      {
        messages: [{ role: 'user', content: 'hello can you search teachers and subjects and years  for me ' }],
      },
      {
        encoding: 'text/event-stream',
        streamMode: ['values', 'updates', 'messages'],
        configurable: { thread_id: 'thrdsdfadasadffad_abc' },
        recursionLimit: 10,
      },
    );
  }
}
