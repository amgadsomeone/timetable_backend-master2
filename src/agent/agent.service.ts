import { GoogleGenAI } from '@google/genai';
import { Injectable, Inject } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ContentListUnion } from '@google/genai';

import {
  createActivities,
  createActivitiesMany,
  createResource,
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
  ) {
    let chat;

    if (userMsg) {
      const isActive = this.isActive.get(chatId);
      if (isActive) return;
      this.isActive.set(chatId, true);
      client.emit('chatIsActive', { chatId: chatId, isActive: true });
      const msg = {
        role: 'user',
        parts: [{ text: userMsg }],
      };
      try {
        await this.ChatService.addMessage(userId, chatId, msg);
      } catch (error) {
        client.emit('chaterror', { chatId: chatId, message: error });
        this.isActive.delete(chatId);
        client.emit('chatIsActive', { chatId: chatId, isActive: false });
        return;
      }
    }
    try {
      chat = await this.ChatService.findChatById(userId, chatId);
    } catch (error) {
      client.emit('chaterror', { chatId: chatId, message: error });
      this.isActive.delete(chatId);
      client.emit('chatIsActive', { chatId: chatId, isActive: false });
      return;
    }
    const content: ContentListUnion = chat.content;
    let response;
    try {
      response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
        config: this.config,
      });
    } catch (error) {
      client.emit('chaterror', { chatId: chatId, message: error });
      this.isActive.delete(chatId);
      client.emit('chatIsActive', { chatId: chatId, isActive: false });
      return;
    }

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

      // Handle different function calls
      switch (tool_call.name) {
        case 'getResources':
          result = await this.agentServiceTools.getResources(
            tool_call.args.resourceType,
            chat.timetable,
            userId,
          );
          break;

        case 'createResource':
          const {
            resourceType,
            resources, // This is our new array
            buildingId,
            yearId,
            groupId,
            capacity,
          } = tool_call.args;

          // Validate that the AI provided a valid array
          if (!resources || !Array.isArray(resources)) {
            throw new Error(
              'Invalid AI arguments: "resources" array is missing or not an array.',
            );
          }

          // Map the AI output to match the service's expected input (longName -> longname)
          const dataForService = resources.map((resource) => ({
            name: resource.name,
            longname: resource.longName, // Explicit mapping
          }));

          result = await this.agentServiceTools.modifySimpleResourceMany(
            resourceType,
            chat.timetable,
            userId,
            dataForService, // Pass the formatted array
            buildingId,
            yearId,
            groupId,
            capacity,
          );
          break;

        case 'removeResourceSingle':
          result = await this.agentServiceTools.removeResourceSingle(
            tool_call.args.type,
            chat.timetable,
            userId,
            tool_call.args.resourceId,
          );
          break;

        case 'createActivities':
          result = await this.agentServiceTools.createActivities(
            chat.timetable,
            tool_call.args.activities,
            userId,
          );
          break;

        default:
          result = `Unknown function: ${tool_call.name}`;
          break;
      }

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
      this.makeAgentcall(client, userId, chatId);
    } else {
      const AgentResponse = response.candidates?.[0]?.content;
      if (!AgentResponse) {
        client.emit('chaterror', {
          chatId: chatId,
          message: 'I was unable to generate a response. try again',
        });

        this.isActive.delete(chatId);
        client.emit('chatIsActive', { chatId: chatId, isActive: false });

        return;
      }
      await this.ChatService.addMessage(userId, chatId, AgentResponse);
      client.emit('AgentResponse', { chatId: chatId, msg: AgentResponse });
      this.isActive.delete(chatId);
      client.emit('chatIsActive', { chatId: chatId, isActive: false });
    }
  }
}
