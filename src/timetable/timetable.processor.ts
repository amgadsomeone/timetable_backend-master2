// timetable.processor.ts
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WorkerHost } from '@nestjs/bullmq'; 
import { TimetableGenerationService } from './timetable.generathion';

@Processor('timetable-generation')
export class TimetableProcessor extends WorkerHost {
  constructor(
    private readonly generationService: TimetableGenerationService,
  ) {
    super(); 
  }

  // This is the old way, but the library now recommends an explicit `process` method
  // @Process('generate')
  // async handleGenerationJob(job: Job<{ timetableId: number; userId: number }>) { ... }
  
  // 4. (RECOMMENDED) Implement the abstract `process` method from WorkerHost
  async process(job: Job<{ timetableId: number; userId: number }>): Promise<any> {
    const { timetableId, userId } = job.data;
    console.log(`Worker processing job ${job.id} for timetable ${timetableId}`);

    // The name of the job is available on job.name
    if (job.name === 'generate') {
      try {
        //const result = await this.generationService.generateAndZip(timetableId, userId);
        console.log(`Job ${job.id} completed.`);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error; // Re-throw the error to mark the job as failed in BullMQ
      }
    } else {
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}