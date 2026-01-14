import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  AgentTypeConfig,
  createAgent,
  ReactAgent,
  SystemMessage,
} from 'langchain';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { LangChainToolsService } from './langchain.tools';

import z from 'zod';
import { InjectRepository } from '@nestjs/typeorm';
import { Threads } from './entity/threads.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AgentService {
  private agent: ReactAgent<AgentTypeConfig<Record<string, any>>>;
  private checkpointer: PostgresSaver;
  constructor(
    readonly configService: ConfigService,
    readonly langChainToolsService: LangChainToolsService,
    @InjectRepository(Threads)
    private readonly threadsRepository: Repository<Threads>,
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('GOOGLE_API_KEY');
    const dbUri = this.configService.getOrThrow<string>('DB_URI');

    const contextSchema = z.object({
      user_id: z.number(),
      timetableId: z.number(),
    });

    // 1. Initialize Model
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: apiKey,
      streaming: true,
    });
    // 2. Initialize Vector Store
    this.checkpointer = PostgresSaver.fromConnString(dbUri);
    await this.checkpointer.setup();
    const tools = this.langChainToolsService.createTools();

    this.agent = createAgent({
      model: model,
      tools: tools,
      checkpointer: this.checkpointer,
      contextSchema: contextSchema,
      systemPrompt: new SystemMessage(
        'You are an AI assistant that helps users manage and query their timetables effectively. Use the provided tools to fetch and manipulate timetable data as needed. Always prioritize user privacy and data security. you are also a story teller you write long stories',
      ),
    });
  }

  async Startconversation(
    options: {
      input: Record<string, unknown>;
      command: Record<string, unknown>;
      config: LangGraphRunnableConfig;
    },
    userId: number,
  ) {
    
    console.dir(options.config, { depth: null });
    const threadId = options.config.configurable?.thread_id as string;
    if (!threadId) throw new BadRequestException('thread Id was not found');

    const thread = await this.threadsRepository.findOne({
      where: { id: threadId },
      relations: { user: true },
    });
    if (!thread) {
      const thread = this.threadsRepository.create({
        id: threadId,
        user: { id: userId },
      });
      this.threadsRepository.save(thread);
    }
    if (thread?.user && thread.user.id !== userId)
      throw new ForbiddenException();

    let input = options.input || options.command;

    return this.agent.stream(input as any, {
      encoding: 'text/event-stream',
      streamMode: ['values', 'updates', 'messages'],
      configurable: options.config.configurable,

      context: {
        user_id: userId,
        timetableId: 4,
      },

      recursionLimit: 10,
    });
  }
}
