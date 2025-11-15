import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create.chat.dto';
import { User } from 'src/users/entity/users.entity';
import { UpdateChatDto } from './dto/update.chat.dto';
import { ContentListUnion } from '@google/genai';
import { Timetable } from 'src/timetable/entity/timetable.entity';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly ChatRepository: Repository<Chat>,
      @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
  ) {}

  async createChat(userId: number, createChat: CreateChatDto) {
    const timetable = await this.timetableRepository.findOne({where:{id:createChat.timetable,User:{id:userId}}})
    if(!timetable){
        throw new ForbiddenException("user does not have a timetable with this id")
    }
    const chat = await this.ChatRepository.create({
      ...createChat,
      user: { id: userId },
    });
    return this.ChatRepository.save(chat);
  }

  async addMessage(userId: number, chatId: number, newPart: any) {
    const chat = await this.ChatRepository.findOne({
      where: { id: chatId, user: { id: userId } },
    });
    if (!chat) throw new NotFoundException('chat not found');

    chat.content.push(newPart);
    return this.ChatRepository.save(chat);
  }

  async findChats(userId: number) {
    return this.ChatRepository.find({
      where: { user: { id: userId } },
      select: { id: true, timetable: true, createdAt: true },
    });
  }

  async findMessages(
    userId: number,
    chatId: number,
  ): Promise<any> {
    const chatContent = await this.ChatRepository.findOne({
      where: { id: chatId, user: { id: userId } },
    });
    if (!chatContent) {
      throw new NotFoundException('messages was not found');
    }
    return chatContent.content
  }

  async findChatById(userId: number, chatId: number) {
    return this.ChatRepository.findOne({
      where: { id: chatId, user: { id: userId } },
    });
  }

  async updateChat(userId: number, chatId: number, UpdateChat: UpdateChatDto) {
    const chat = await this.ChatRepository.findOne({
      where: { id: chatId, user: { id: userId } },
    });
    if (!chat) {
      throw new NotFoundException('chat was not found');
    }
    chat.timetable = UpdateChat.timetable!;
    await this.ChatRepository.save(chat);
    return this.findChatById(userId,chatId)
  }

  async deleteChat(userId: number, chatId: number) {
    const chat = await this.ChatRepository.findOne({
      where: { id: chatId, user: { id: userId } },
    });

    if (!chat) {
      throw new NotFoundException('chat was not found');
    }

    await this.ChatRepository.delete(chat);
    return this.findMessages(userId, chatId);
  }
}
