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
import { JSDOM } from 'jsdom';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import type { Response } from 'express';
import archiver = require('archiver');

// Configuration for file processing to make the code DRY
const FILES_TO_PROCESS = [
  { identifier: '_years_days_horizontal.html', outputName: 'years_table.html' },
  {
    identifier: '_groups_days_horizontal.html',
    outputName: 'groups_table.html',
  },
  {
    identifier: '_subgroups_days_horizontal.html',
    outputName: 'subgroups_table.html',
  },
  {
    identifier: '_teachers_days_horizontal.html',
    outputName: 'teachers_table.html',
  },
];

@Injectable()
export class TimetableGenerationService {
  constructor(
    private readonly timetablesService: TimetableService,
    private readonly fetExportService: FetExportService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  async generateAndZip(
    timetableId: number,
    userId: number,
    res: Response,
  ): Promise<void> {
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

      const archive = archiver('zip', { zlib: { level: 9 } });

      // The 'finish' event on the response is the correct and reliable way to know when to cleanup.
      res.on('finish', () => {
        console.log(
          `Response finished. Cleaning up directory: ${operationDir}`,
        );
        fs.rm(operationDir, { recursive: true, force: true }).catch(
          console.error,
        );
      });

      // Handle errors during archiving
      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);
      archive.directory(rawOutputDirPath, false);
      await archive.finalize();
    } catch (error) {
      // If an error occurs before streaming, clean up immediately and throw
      await fs
        .rm(operationDir, { recursive: true, force: true })
        .catch(() => {});
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
    console.log(`Spawning command: ${fetExecutable} ${commandArgs.join(' ')}`);

    return new Promise((resolve, reject) => {
      const process = spawn(fetExecutable, commandArgs);

      let stderr = '';

      // The server remains responsive while listening to these streams
      process.stdout.on('data', (data) =>
        console.log(`fet-cl stdout: ${data}`),
      );
      process.stderr.on('data', (data) => {
        console.error(`fet-cl stderr: ${data}`);
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('FET process completed successfully.');
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

  async extractTablesOnly(htmlString) {
    const dom = new JSDOM(htmlString);

    const document = dom.window.document;

    const tables = document.querySelectorAll('table');

    tables.forEach((table) => {
      const footerRows = table.querySelectorAll('tr.foot');
      footerRows.forEach((row) => row.remove());
    });

    let result =
      '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>Tables Only</title>\n<link rel="stylesheet" href="style.css" type="text/css" />\n</head>\n<body>\n\n';

    tables.forEach((table) => {
      result += table.outerHTML + '\n\n';
    });

    result += '</body>\n</html>';

    return result;
  }
  // processFile and extractTablesOnly methods remain the same as your refactored version
  // ... (make sure processFile throws errors instead of exiting)
  async processFile(inputPath, outputPath) {
    try {
      const htmlContent = await fs.readFile(inputPath, 'utf8');
      const tablesOnly = await this.extractTablesOnly(htmlContent);
      await fs.writeFile(outputPath, tablesOnly, 'utf8');
    } catch (error) {
      console.error(`Error processing file ${inputPath}:`, error.message);
      // Re-throw the error so Promise.all can catch it
      throw new InternalServerErrorException(`Failed to process ${inputPath}`);
    }
  }

  // ... extractTablesOnly ...
}
