import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  async validateDto<T extends object>(
    dtoClass: new () => T,
    plainObject: any,
  ): Promise<{ success: boolean; dto?: T; errors?: string[] }> {
    const dtoInstance = plainToInstance(dtoClass, plainObject);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) =>
        Object.values(error.constraints || {}).join(', '),
      );
      return { success: false, errors: errorMessages };
    }

    return { success: true, dto: dtoInstance };
  }
}
