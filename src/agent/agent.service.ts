import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatCerebras } from '@langchain/cerebras';

import {
  AgentTypeConfig,
  createAgent,
  humanInTheLoopMiddleware,
  ReactAgent,
  SystemMessage,
  createMiddleware,
} from 'langchain';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import { Command, type LangGraphRunnableConfig } from '@langchain/langgraph';
import { LangChainToolsService } from './langchain.tools';
import { FileConversionService } from './file.conversion.service';

import z from 'zod';
import { InjectRepository } from '@nestjs/typeorm';
import { Threads } from './entity/threads.entity';
import { Repository } from 'typeorm';
import { Message } from '@langchain/core/messages';

@Injectable()
export class AgentService {
  private agent: ReactAgent<AgentTypeConfig<Record<string, any>>>;
  private checkpointer: PostgresSaver;
  constructor(
    readonly configService: ConfigService,
    readonly langChainToolsService: LangChainToolsService,
    readonly fileConversionService: FileConversionService,
    @InjectRepository(Threads)
    private readonly threadsRepository: Repository<Threads>,
  ) { }


  async onModuleInit() {
    const dbUri = this.configService.getOrThrow<string>('DB_URI');

    const contextSchema = z.object({
      userId: z.number(),
      timetableId: z.number(),
      model: z.string().optional(),
    });

    const modelsMap = {
      'gpt-oss-120b': new ChatCerebras({ model: 'gpt-oss-120b' }),
      'gemini-2.5-flash-lite': new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash-lite',
      }),
      'gemini-2.5-flash': new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
      }),
      'gemini-3-flash-preview': new ChatGoogleGenerativeAI({
        model: 'gemini-3-flash-preview',
      }),
      'zai-glm-4.7': new ChatCerebras({ model: 'zai-glm-4.7' }),
      'zai-glm-4.6': new ChatCerebras({ model: 'zai-glm-4.6' }),
      'qwen-3-32b': new ChatCerebras({ model: 'qwen-3-32b' }),
      'qwen-3-235b-a22b-instruct-2507': new ChatCerebras({
        model: 'qwen-3-235b-a22b-instruct-2507',
      }),
      'llama-3.3-70b': new ChatCerebras({ model: 'llama-3.3-70b' }),
    };

    const dynamicModelSelection = createMiddleware({
      name: 'DynamicModelSelection',
      wrapModelCall: (request, handler) => {

        const modelName = (request.runtime.context as any)?.model as string;
        if (!modelName || !modelsMap[modelName]) {
          return handler(request);
        }

        return handler({
          ...request,
          model: modelsMap[modelName],
        });
      },
    });

    // 2. Initialize Vector Store
    this.checkpointer = PostgresSaver.fromConnString(dbUri);
    await this.checkpointer.setup();
    const tools = this.langChainToolsService.createTools();

    this.agent = createAgent({
      model: modelsMap['gpt-oss-120b'],
      tools: tools,
      checkpointer: this.checkpointer,
      contextSchema: contextSchema,
      systemPrompt: new SystemMessage(
        'You are an AI assistant that helps users manage and query their timetables effectively. Use the provided tools to fetch and manipulate timetable data as needed. Always prioritize user privacy and data security. do not over fetch data if you do not need it if your already fetched subjects for example do not fetch it again if you already have its data in your context do this for other data as well you must save your context window , write in markdown ',
      ),
      middleware: [
        dynamicModelSelection,
        humanInTheLoopMiddleware({
          interruptOn: {
            getResources: false,

            createSimpleResourceMany: {
              allowedDecisions: ['approve', 'reject'],
            },
            createActivities: {
              allowedDecisions: ['approve', 'reject'],
            },

            updateResources: {
              allowedDecisions: ['approve', 'reject'],
            },
            updateActivities: {
              allowedDecisions: ['approve', 'reject'],
            },
            deleteResources: {
              allowedDecisions: ['approve', 'reject'],
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
      context: Record<string, unknown>;
    },
    userId: number,
  ) {
    console.dir(options, { depth: null })
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
        messages: await this.fileConversionService.normalizeMessages(
          options.input.messages as Message[],
        ),
      };
    }


    let input = options.input || new Command(options.command);

    return this.agent.stream(input as any, {
      encoding: 'text/event-stream',
      streamMode: ['values', 'updates', 'messages'],
      configurable: options.config.configurable,

      context: {
        userId: userId,
        timetableId: options.context?.timetableId,
        model: options.context?.model,
      },

      recursionLimit: 50,
    });
  }
}
