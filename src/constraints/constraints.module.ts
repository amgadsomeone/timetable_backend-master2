import { Module } from '@nestjs/common';
import { ConstraintsController } from './constraints.controller';
import { ConstraintsService } from './constraints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaxGapsPerWeekConstraint } from './entity/timeConstraints/maxGapConstraints.entity';
import { NotAvailableConstraint } from './entity/timeConstraints/notavailableConstraints.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaxGapsPerWeekConstraint,
      NotAvailableConstraint,
    ]),
  ],
  controllers: [ConstraintsController],
  providers: [ConstraintsService],
})
export class ConstraintsModule {}
