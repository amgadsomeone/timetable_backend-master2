import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create.chat.dto';
import { UpdateChatDto } from './dto/update.chat.dto';
import { ClerkAuthGuard } from 'src/auth/gurds/clerk-auth.guard';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('chat')
@ApiBearerAuth('bearerAuth') // Match the name from your setupSwagger function
@UseGuards(ClerkAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() createChatDto: CreateChatDto, @GetUserId() userId: number) {
    return this.chatService.createChat(userId, createChatDto);
  }

  @Get()
  findAll(@GetUserId() userId: number) {
    return this.chatService.findChats(userId);
  }
  @Get(':id/messages')
  findMessages(@Param('id') id: string, @GetUserId() userId: number) {
    console.log(id)
    return this.chatService.findMessages(userId, +id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUserId() userId: number) {
    return this.chatService.findChatById(userId, +id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
    @GetUserId() userId: number,
  ) {
    return this.chatService.updateChat(userId, +id, updateChatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUserId() userId: number) {
    return this.chatService.deleteChat(userId, +id);
  }
}
