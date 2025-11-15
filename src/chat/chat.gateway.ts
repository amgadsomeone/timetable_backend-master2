import { clerkClient, getAuth, verifyToken } from '@clerk/express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AgentService } from 'src/agent/agent.service';
import { AgentTools } from 'src/agent/agent.service.tools';
import { User } from 'src/users/entity/users.entity';
import { Repository } from 'typeorm';

const contents: any[] = [];
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly AgentService: AgentService,
    private readonly ConfigService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @WebSocketServer()
  server: Server;

  private clients = new Map<Socket, number>();

  async handleConnection(client: Socket) {
    console.log("new connecthion attempt")
    const userId = await this.authenticateClient(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    this.clients.set(client, userId);
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client);
    client.disconnect();
  }

  @SubscribeMessage('chatAgent')
  async chatAgent(
    @MessageBody() data: { msg: string; chatId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(data)
    const userId = this.clients.get(client);
    if (!userId) return;
    this.AgentService.makeAgentcall(client, userId, data.chatId, data.msg);
  }

  private async authenticateClient(client: Socket) {
    const token = client.handshake.headers?.authorization?.split(' ')[1] || client.handshake.auth.token
    if (!token) return;
    try {
      const payload = await verifyToken(token, {
        jwtKey: this.ConfigService.getOrThrow('CLERK_JWT_KEY'),
      });

      if (!payload) return;

      const clerkUser = await clerkClient.users.getUser(payload.sub);
      let user = await this.userRepository.findOne({
        where: { clerkId: clerkUser.id },
      });

      if (!user) {
        user = this.userRepository.create({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? undefined,
          firstName: clerkUser.firstName ?? undefined,
          lastName: clerkUser.lastName ?? undefined,
        });
        await this.userRepository.save(user);
      }
      return user.id;
    } catch (error) {
      return;
    }
  }
}
