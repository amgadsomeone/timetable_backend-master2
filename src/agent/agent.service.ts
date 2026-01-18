import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatCerebras } from '@langchain/cerebras';
import { ChatOllama } from '@langchain/ollama';

import {
  AgentTypeConfig,
  createAgent,
  humanInTheLoopMiddleware,
  ReactAgent,
  SystemMessage,
  initChatModel,
  createMiddleware,
} from 'langchain';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import { Command, type LangGraphRunnableConfig } from '@langchain/langgraph';
import { LangChainToolsService } from './langchain.tools';

import z from 'zod';
import { InjectRepository } from '@nestjs/typeorm';
import { Threads } from './entity/threads.entity';
import { Repository } from 'typeorm';
enum Color {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
}
import pdfParse from 'pdf-parse';
import { Message } from '@langchain/core/messages';

async function pdfBase64ToText(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  const result = await pdfParse(buffer);
  return result.text;
}

async function normalizeMessages(messages: Message[]): Promise<Message[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (typeof message.content === 'string') {
        return message;
      }
      const newContent = await Promise.all(
        message.content.map(async (block) => {
          if (block.type !== 'file') return block;

          if (block.mime_type === 'application/pdf') {
            const text = await pdfBase64ToText(block.data as string);
            const fileContent = `
=====START_FILE=====
fileType: ${block.type}
content:
${text.trim()}
=====END_FILE=====
`;
            return {
              type: 'text',
              text: fileContent,
            };
          }

          // fallback if file type not supported
          return {
            type: 'text',
            text: '',
          };
        }),
      );

      return {
        ...message,
        content: newContent,
      };
    }),
  );
}

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
    const apiKey = this.configService.getOrThrow<string>('GROQ_API_KEY');
    const dbUri = this.configService.getOrThrow<string>('DB_URI');

    const contextSchema = z.object({
      userId: z.number(),
      timetableId: z.number(),
    });

    // 1. Initialize Model
    const visionModel = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash-lite',
      maxOutputTokens: 2048,
    });

    const model = new ChatGroq({
      model: 'openai/gpt-oss-120b',
      temperature: 0,
      maxTokens: undefined,
      apiKey: apiKey,
      maxRetries: 2,
      // other params...
    });

    const llm = new ChatCerebras({
      model: 'llama-3.3-70b',
    });
    const model44 = await initChatModel('gemini-2.5-flash-lite', {
      modelProvider: 'openai',
    });

    const model2 = new ChatGroq({
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      temperature: 0,
      maxTokens: undefined,
      apiKey: apiKey,
      maxRetries: 2,
      // other params...
    });

    const dynamicModelSelection = createMiddleware({
      name: 'DynamicModelSelection',
      wrapModelCall: (request, handler) => {
        // Choose model based on conversation complexity
        const context = request.runtime.context;
        console.log('hello');
        console.log(context);

        return handler({
          ...request,
        });
      },
    });
    const llmolamma = new ChatOllama({
      model: 'gpt-oss:120b-cloud',
      // other params...
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
      middleware: [
        humanInTheLoopMiddleware({
          interruptOn: {
            getResources: false,

            createSimpleResourceMany: {
              allowedDecisions: ['approve', 'reject'],
              description: '🚨 SQL execution requires DBA approval',
            },
            createActivities: {
              allowedDecisions: ['approve', 'reject'],
              description: '🚨 SQL execution requires DBA approval',
            },

            updateResources: {
              allowedDecisions: ['approve', 'reject'],
              description: '🚨 SQL execution requires DBA approval',
            },
            updateActivities: {
              allowedDecisions: ['approve', 'reject'],
              description: '🚨 SQL execution requires DBA approval',
            },
            getEntityWithRelations: {
              allowedDecisions: ['approve', 'reject'],
              description: '🚨 SQL execution requires DBA approval',
            },
            deleteResources: {
              allowedDecisions: ['approve', 'reject'],
              description: '🚨 SQL execution requires DBA approval',
            },
          },

          descriptionPrefix: 'Tool execution pending approval',
        }),
      ],
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
    console.dir(options.config,{depth:null})
    const threadId = options.config.configurable?.thread_id as string;
    if (!threadId) throw new BadRequestException('thread Id was not found');

    const thread = await this.threadsRepository.findOne({
      where: { id: threadId },
      relations: { user: true },
    });
    if (thread?.user && thread.user.id !== userId)
      throw new ForbiddenException();
    if (!thread) {
      const thread = this.threadsRepository.create({
        id: threadId,
        user: { id: userId },
      });
      this.threadsRepository.save(thread);
    }

    if (options.input) {
      options.input = {
        ...options.input,
        messages: await normalizeMessages(options.input.messages as Message[]),
      };
    }

    let input = options.input || new Command(options.command);

    return this.agent.stream(input as any, {
      encoding: 'text/event-stream',
      streamMode: ['values', 'updates', 'messages'],
      configurable: options.config.configurable,

      context: {
        userId: userId,
        timetableId: 33,
      },

      recursionLimit: 50,
    });
  }
}
