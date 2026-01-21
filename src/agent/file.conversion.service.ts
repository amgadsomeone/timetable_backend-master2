import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { Message } from '@langchain/core/messages';

@Injectable()
export class FileConversionService {
    async pdfBase64ToText(base64: string): Promise<string> {
        const buffer = Buffer.from(base64, 'base64');
        const result = await (pdfParse as any)(buffer);
        return result.text;
    }


    async wordBase64ToText(base64: string): Promise<string> {
        const buffer = Buffer.from(base64, 'base64');
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    async excelBase64ToText(base64: string): Promise<string> {
        const buffer = Buffer.from(base64, 'base64');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let text = '';
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            text += `Sheet: ${sheetName}\n`;
            text += xlsx.utils.sheet_to_csv(worksheet);
            text += '\n\n';
        });
        return text;
    }

    async csvBase64ToText(base64: string): Promise<string> {
        const buffer = Buffer.from(base64, 'base64');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        return xlsx.utils.sheet_to_csv(worksheet);
    }

    async normalizeMessages(messages: Message[]): Promise<Message[]> {
        return Promise.all(
            messages.map(async (message) => {
                if (typeof message.content === 'string') {
                    return message;
                }

                const newContent = await Promise.all(
                    (message.content as any[]).map(async (block) => {
                        if (block.type !== 'file') return block;

                        let text = '';
                        const mimeType = block.mimeType;
                        const base64Data = block.data as string;

                        try {
                            if (mimeType === 'application/pdf') {
                                text = await this.pdfBase64ToText(base64Data);
                            } else if (
                                mimeType ===
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            ) {
                                text = await this.wordBase64ToText(base64Data);
                            } else if (
                                mimeType ===
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                                mimeType === 'application/vnd.ms-excel'
                            ) {
                                text = await this.excelBase64ToText(base64Data);
                            } else if (mimeType === 'text/csv') {
                                text = await this.csvBase64ToText(base64Data);
                            } else {
                                // If not handled, return as is (maybe it's an image for Gemini)
                                return block;
                            }

                            const fileContent = `
=====START_FILE=====
fileType: ${mimeType}
content:
${text.trim()}
=====END_FILE=====
`;
                            return {
                                type: 'text',
                                text: fileContent,
                            };
                        } catch (error) {
                            console.error(`Error converting file of type ${mimeType}:`, error);
                            return {
                                type: 'text',
                                text: `[Error converting file: ${mimeType}]`,
                            };
                        }
                    }),
                );

                return {
                    ...message,
                    content: newContent,
                } as Message;
            }),
        );
    }
}
