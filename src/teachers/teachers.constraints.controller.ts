import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersConstraintsService } from './teachers.constraints.service';
import { GetUserId } from 'src/auth/decorators/get-user-id.decorator';
import {
    SetMaxGapsDto,
    ResetMaxGapsDto,
    CreateTeacherNotAvailableManyDto,
    DeleteNotAvailableConstraintsDto,
} from './dto/constraints.dto';

@ApiTags('Teacher Constraints')
@Controller('teachers/constraints')
@ApiBearerAuth('bearerAuth')
export class TeachersConstraintsController {
    constructor(
        private readonly constraintsService: TeachersConstraintsService,
    ) { }

    // MaxGaps endpoints
    @Post('max-gaps')
    @ApiOperation({ summary: 'Set max gaps per day for teachers' })
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    setMaxGapsPerDay(@GetUserId() userId: number, @Body() dto: SetMaxGapsDto) {
        return this.constraintsService.setMaxGapsPerDayMany(userId, dto.data);
    }

    @Delete('max-gaps')
    @ApiOperation({ summary: 'Reset max gaps per day for teachers' })
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    resetMaxGapsPerDay(
        @GetUserId() userId: number,
        @Body() dto: ResetMaxGapsDto,
    ) {
        return this.constraintsService.resetMaxGapsPerDayMany(userId, dto.ids);
    }

    // NotAvailable endpoints
    @Get(':timetableId/with-not-available')
    @ApiOperation({ summary: 'Get teachers with not available constraints' })
    getWithNotAvailable(
        @GetUserId() userId: number,
        @Param('timetableId', ParseIntPipe) timetableId: number,
    ) {
        return this.constraintsService.getWithNotAvailableConstraints(
            timetableId,
            userId,
        );
    }

    @Post(':timetableId/not-available')
    @ApiOperation({ summary: 'Create not available constraints for teachers' })
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    setNotAvailable(
        @GetUserId() userId: number,
        @Param('timetableId', ParseIntPipe) timetableId: number,
        @Body() dto: CreateTeacherNotAvailableManyDto,
    ) {
        return this.constraintsService.setNotAvailableConstraintsMany(
            userId,
            timetableId,
            dto.constraints,
        );
    }

    @Get(':timetableId/not-available')
    @ApiOperation({ summary: 'Get not available constraints for teachers' })
    getNotAvailable(
        @GetUserId() userId: number,
        @Param('timetableId', ParseIntPipe) timetableId: number,
    ) {
        return this.constraintsService.getNotAvailableConstraints(
            timetableId,
            userId,
        );
    }

    @Delete(':timetableId/not-available')
    @ApiOperation({ summary: 'Delete not available constraints for teachers' })
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    deleteNotAvailable(
        @GetUserId() userId: number,
        @Param('timetableId', ParseIntPipe) timetableId: number,
        @Body() dto: DeleteNotAvailableConstraintsDto,
    ) {
        return this.constraintsService.deleteNotAvailableConstraints(
            dto.ids,
            timetableId,
            userId,
        );
    }
}
