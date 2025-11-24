import { GoogleGenAI } from '@google/genai';
import { Injectable, Inject } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ContentListUnion } from '@google/genai';
import { encode } from '@toon-format/toon';

import {
  createActivitiesMany,
  createResourceMany,
  getResources,
  removeResourceSingle,
} from './Function.Declaration';
import { systemInstruction } from './types';
import { ChatService } from 'src/chat/chat.service';
import { AgentTools } from './agent.service.tools';

@Injectable()
export class AgentService {
  private config;
  private isActive: Map<number, boolean>;
  constructor(
    @Inject('gemini') private readonly ai: GoogleGenAI,
    private readonly ChatService: ChatService,
    private readonly agentServiceTools: AgentTools,
  ) {
    this.config = {
      systemInstruction: systemInstruction,
      tools: [
        {
          functionDeclarations: [
            getResources,
            createActivitiesMany,
            removeResourceSingle,
            createResourceMany,
          ],
        },
      ],
    };
    this.isActive = new Map<number, boolean>();
  }

  async makeAgentcall(
    client: Socket,
    userId: number,
    chatId: number,
    userMsg?: string,
    counter: number = 0,
  ) {
    if (counter && counter > 15) {
      client.emit('chaterror', {
        chatId: chatId,
        message: 'ai has been working for a while do you want to continue',
      });
      this.isActive.delete(chatId);
      client.emit('chatIsActive', { chatId: chatId, isActive: false });
      return;
    }
    try {
      if (userMsg) {
        const isActive = this.isActive.get(chatId);
        if (isActive) return;
        this.isActive.set(chatId, true);
        client.emit('chatIsActive', { chatId: chatId, isActive: true });
        const msg = {
          role: 'user',
          parts: [{ text: userMsg }],
        };

        await this.ChatService.addMessage(userId, chatId, msg);
      }
      const chat = await this.ChatService.findChatById(userId, chatId);
      console.log(`timetable is ${chat?.timetable}`);

      if (!chat) return;
      const content: ContentListUnion = chat.content;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
        config: this.config,
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        const tool_call = response.functionCalls[0] as any;

        let type = tool_call.args.resourceType;
        if (tool_call.name === 'createActivities') type = 'activities';

        const functhionPart = response.candidates![0].content;
        await this.ChatService.addMessage(userId, chatId, functhionPart);
        client.emit('functionCall', {
          chatId: chatId,
          role: 'model',
          toolName: tool_call.name,
          type: type,
          timetableId: chat.timetable,
        });

        let result: any;
        try {
          switch (tool_call.name) {
            case 'getResources':
              result = encode(
                await this.agentServiceTools.getResources(
                  tool_call.args.resourceType,
                  chat.timetable,
                  userId,
                ),
              );
              break;

            case 'createResource':
              const {
                resourceType,
                resources,
                buildingId,
                yearId,
                groupId,
                capacity,
              } = tool_call.args;

              if (!resources || !Array.isArray(resources)) {
                throw new Error(
                  'Invalid AI arguments: "resources" array is missing or not an array.',
                );
              }

              const dataForService = resources.map((resource) => ({
                name: resource.name,
                longname: resource.longName,
              }));

              result = JSON.stringify(
                await this.agentServiceTools.modifySimpleResourceMany(
                  resourceType,
                  chat.timetable,
                  userId,
                  dataForService,
                  buildingId,
                  yearId,
                  groupId,
                  capacity,
                ),
              );
              break;

            case 'removeResourceSingle':
              result = JSON.stringify(
                await this.agentServiceTools.removeResourceSingle(
                  tool_call.args.type,
                  chat.timetable,
                  userId,
                  tool_call.args.resourceId,
                ),
              );

              break;

            case 'createActivities':
              result = JSON.stringify(
                await this.agentServiceTools.createActivities(
                  chat.timetable,
                  tool_call.args.activities,
                  userId,
                ),
              );

              break;

            default:
              result = `Unknown function: ${tool_call.name}`;
              break;
          }
        } catch (error) {
          result = JSON.stringify(error);
        }
        console.log(tool_call.name);
        console.log(result);
        const function_response_part = {
          name: tool_call.name,
          response: { result },
        };

        const functionResponse = {
          role: 'user',
          parts: [{ functionResponse: function_response_part }],
        };
        await this.ChatService.addMessage(userId, chatId, functionResponse);

        client.emit('functionCallEnd', {
          chatId: chatId,
          role: 'user',
          toolName: tool_call.name,
          type: type,
          timetableId: chat.timetable,
        });

        // Continue the conversation
        this.makeAgentcall(client, userId, chatId, undefined, ++counter);
      } else {
        const AgentResponse = response.candidates?.[0]?.content;
        if (!AgentResponse) {
          this.makeAgentcall(client, userId, chatId, undefined, ++counter);
          return;
        }
        await this.ChatService.addMessage(userId, chatId, AgentResponse);
        client.emit('AgentResponse', { chatId: chatId, msg: AgentResponse });
        this.isActive.delete(chatId);
        client.emit('chatIsActive', { chatId: chatId, isActive: false });
      }
    } catch (error) {
      if (error.status == 503) {
        this.makeAgentcall(client, userId, chatId, undefined, ++counter);
        return;
      }
      client.emit('chaterror', { chatId: chatId, message: error });
      this.isActive.delete(chatId);
      client.emit('chatIsActive', { chatId: chatId, isActive: false });
      return;
    }
  }
}
