// timetable.generathion.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { spawn } from 'child_process'; // Use spawn for streaming
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { FetExportService } from './fet.service';
import { TimetableService } from './timetable.service';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import type { Response } from 'express';
import archiver = require('archiver');

@Injectable()
export class TimetableGenerationService {
  constructor(
    private readonly timetablesService: TimetableService,
    private readonly fetExportService: FetExportService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) { }

  async generateAndZip(timetableId: number, userId: number, res: Response) {
    console.time('test');
    const fullTimetable = await this.timetablesService.findFull(
      timetableId,
      userId,
    );
    console.timeEnd('test');

    if (!fullTimetable)
      throw new NotFoundException(
        `Timetable with ID ${timetableId} not found.`,
      );
    if (fullTimetable.activities.length <= 0)
      throw new BadRequestException(
        'Timetable must contain at least 1 activity.',
      );
    if (fullTimetable.days.length <= 0 || fullTimetable.hours.length <= 0) {
      throw new BadRequestException(
        'timetable must contain atleast 1 or more days and hours',
      );
    }
    const totalHourPerWeek =
      fullTimetable.hours.length * fullTimetable.days.length;

    const teachermap = new Map<number, number>();
    const yearMap = new Map<number, number>();
    const groupMap = new Map<number, number>();
    const subgroupMap = new Map<number, number>();

    const teachernames = new Map<number, string>();
    const yearNames = new Map<number, string>();
    const groupNames = new Map<number, string>();
    const subgroupNames = new Map<number, string>();

    const errorstoSend: string[] = [];
    fullTimetable.activities.forEach((activity) => {
      activity.teachers.forEach((teacher) => {
        const hours = teachermap.get(teacher.id) || 0;
        teachernames.set(teacher.id, teacher.name);
        teachermap.set(teacher.id, hours + activity.duration);
      });
      activity.years.forEach((year) => {
        const hours = yearMap.get(year.id) || 0;
        yearNames.set(year.id, year.name);
        yearMap.set(year.id, hours + activity.duration);
      });
      activity.groups.forEach((group) => {
        const hours = groupMap.get(group.id) || 0;
        groupNames.set(group.id, group.name);
        groupMap.set(group.id, hours + activity.duration);
      });
      activity.subGroups.forEach((subgroup) => {
        const hours = subgroupMap.get(subgroup.id) || 0;
        subgroupNames.set(subgroup.id, subgroup.name);
        subgroupMap.set(subgroup.id, hours + activity.duration);
      });
    });
    teachermap.forEach((value, key) => {
      if (value > totalHourPerWeek) {
        errorstoSend.push(
          `teacher with name ${teachernames.get(key)} is overscheduled with ${value} hours (limit is ${totalHourPerWeek}) hours per weak. `,
        );
      }
    });
    yearMap.forEach((value, key) => {
      if (value > totalHourPerWeek) {
        errorstoSend.push(
          `year with name ${yearNames.get(key)} is overscheduled with ${value} hours (limit is ${totalHourPerWeek}) hours per weak. `,
        );
      }
    });
    groupMap.forEach((value, key) => {
      if (value > totalHourPerWeek) {
        errorstoSend.push(
          `group with name ${groupNames.get(key)} is overscheduled with ${value} hours (limit is ${totalHourPerWeek}) hours per weak. `,
        );
      }
    });
    subgroupMap.forEach((value, key) => {
      if (value > totalHourPerWeek) {
        errorstoSend.push(
          `subgroup with name ${subgroupNames.get(key)} is overscheduled with ${value} hours (limit is ${totalHourPerWeek}) hours per weak. `,
        );
      }
    });
    if (errorstoSend.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message: errorstoSend,
      });
    }
    /*
    const errors: string[] = [];
    fullTimetable.teachers.forEach((teacher) => {
      if (teacher.assigned_hours > totalHourPerWeek) {
        errors.push(
          `Teacher "${teacher.name}" is overscheduled with ${teacher.assigned_hours} hours (limit is ${totalHourPerWeek}).`,
        );
      }
    });

    fullTimetable.years.forEach((year) => {
      if (year.assigned_hours > totalHourPerWeek) {
        errors.push(
          `Year "${year.name}" is overscheduled with ${year.assigned_hours} hours (limit is ${totalHourPerWeek}).`,
        );
      }
    });

    fullTimetable.groups.forEach((group) => {
      if (group.assigned_hours > totalHourPerWeek) {
        errors.push(
          `Group "${group.name}" is overscheduled with ${group.assigned_hours} hours (limit is ${totalHourPerWeek}).`,
        );
      }
    });

    fullTimetable.subGroups.forEach((subgroup) => {
      if (subgroup.assigned_hours > totalHourPerWeek) {
        errors.push(
          `Subgroup "${subgroup.name}" is overscheduled with ${subgroup.assigned_hours} hours (limit is ${totalHourPerWeek}).`,
        );
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('\n'));
    }
    */
    const uniqueId = `timetable-${timetableId}-${Date.now()}`;
    const tempDir = os.tmpdir();
    const operationDir = path.join(tempDir, uniqueId); // A single directory for all temp files
    const inputFilePath = path.join(operationDir, 'input.fet');
    const rawOutputDirPath = path.join(operationDir, 'raw-output');
    const finalOutputDirPath = path.join(operationDir, 'final-output');

    try {
      // 1. Setup directories
      await fs.mkdir(operationDir, { recursive: true });
      await fs.mkdir(rawOutputDirPath, { recursive: true });
      await fs.mkdir(finalOutputDirPath, { recursive: true });

      // 2. Generate and write the .fet file
      const xmlContent = this.fetExportService.generateFetXml(fullTimetable);
      await fs.writeFile(inputFilePath, xmlContent);

      // 3. Run the non-blocking generation process
      await this.runFetGenerator(inputFilePath, rawOutputDirPath);

      // 4. Filter and process output files
      const fileMapping = {
        'input_years_days_horizontal.html': 'Years.html',
        'input_teachers_days_horizontal.html': 'Teachers.html',
        'input_subjects_days_horizontal.html': 'Subjects.html',
        'input_subgroups_days_horizontal.html': 'Subgroups.html',
        'input_groups_days_horizontal.html': 'Groups.html',
        'input_activities_days_horizontal.html': 'Activities.html',
      };

      const fetInputFolder = path.join(rawOutputDirPath, 'timetables', 'input');

      const processingPromises = Object.entries(fileMapping).map(
        async ([originalName, newName]) => {
          const inputPath = path.join(fetInputFolder, originalName);
          const outputPath = path.join(finalOutputDirPath, newName);
          try {
            await fs.access(inputPath);
            await fs.copyFile(inputPath, outputPath);
          } catch (e) {
            console.warn(`Warning: File ${originalName} not found.`);
          }
        },
      );

      await Promise.all(processingPromises);

      // 5. Copy style.css to final output
      const cssSourcePath = path.join(__dirname, 'css', 'input_stylesheet.css');
      const cssDestPath = path.join(finalOutputDirPath, 'input_stylesheet.css');
      try {
        await fs.copyFile(cssSourcePath, cssDestPath);
      } catch (e) {
        console.error('Failed to copy style.css:', e);
      }

      const archive = archiver('zip', { zlib: { level: 9 } });

      // The 'finish' event on the response is the correct and reliable way to know when to cleanup.
      res.on('finish', () => {
        fs.rm(operationDir, { recursive: true, force: true }).catch(
          console.error,
        );
      });

      // Handle errors during archiving
      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);
      archive.directory(finalOutputDirPath, false);
      await archive.finalize();
    } catch (error) {
      // If an error occurs before streaming, clean up immediately and throw
      await fs.rm(operationDir, { recursive: true, force: true }).catch(() => { });
      console.error('Error during timetable generation:', error);
      throw new InternalServerErrorException(
        `Failed to generate timetable: ${error.message}`,
      );
    }
  }

  private runFetGenerator(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const fetExecutable = this.configService.get<string>('FET_EXECUTABLE_PATH');
    if (!fetExecutable) {
      throw new InternalServerErrorException(
        'FET executable path is not configured.',
      );
    }

    // Use spawn for non-blocking I/O streams
    const commandArgs = [
      `--inputfile=${inputPath}`,
      `--outputdir=${outputPath}`,
    ];

    return new Promise((resolve, reject) => {
      const process = spawn(fetExecutable, commandArgs);

      let stderr = '';

      // The server remains responsive while listening to these streams

      process.stderr.on('data', (data) => {
        console.error(`fet-cl stderr: ${data}`);
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `FET process exited with code ${code}. Stderr: ${stderr}`,
            ),
          );
        }
      });

      process.on('error', (err) => {
        reject(
          new Error(
            `Failed to start FET process. Make sure the path is correct. Error: ${err.message}`,
          ),
        );
      });
    });
  }
}
