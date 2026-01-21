import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConstraintsService } from './constraints.service';
import { CreateMaxGapConstraintDto } from './dto/max-gap-constraint.dto';
import { CreateNotAvailableConstraintsManyDto } from './dto/not-available-constraint.dto';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Constraints')
@Controller('constraints')
@ApiBearerAuth('bearerAuth')
export class ConstraintsController {
    constructor(private readonly constraintsService: ConstraintsService) { }
    /*
        @Post('not-available/many')
        @ApiOperation({ summary: 'Set many not available constraints' })
        @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
        async setNotAvailableMany(
            @GetUserId() userId: number,
            @Body() dto: CreateNotAvailableConstraintsManyDto,
        ) {
            return this.constraintsService.setNotAvailableConstraintsMany(userId, dto.constraints);
        }
            */
}
