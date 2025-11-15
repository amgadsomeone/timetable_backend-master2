// http-clerk-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clerkClient, requireAuth, getAuth, verifyToken } from '@clerk/express';
import { User } from 'src/users/entity/users.entity';
import { emit } from 'process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly ConfigService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers?.authorization?.split(' ')[1];
    if (!token) return false;
    try {
      const payload = await verifyToken(token, {
        jwtKey: this.ConfigService.getOrThrow('CLERK_JWT_KEY'),
      });

      if (!payload) return false;

      let user = await this.userRepository.findOne({
        where: { clerkId: payload.sub },
      });

      if (!user) {
        const clerkUser = await clerkClient.users.getUser(payload.sub);
        user = this.userRepository.create({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? undefined,
          firstName: clerkUser.firstName ?? undefined,
          lastName: clerkUser.lastName ?? undefined,
        });
        await this.userRepository.save(user);
      }
      request.user = user;
      return true;
    } catch (error) {
      return false;
    }
  }
}
