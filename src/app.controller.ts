import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
  Headers,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import type { ttsMessage } from './tts_message';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ping')
  getPing(): string {
    return this.appService.getPing();
  }

  @Post('/tts_clear_cache')
  clearTTSCache(): void {
    return this.appService.clearTTSCache();
  }

  @Post('/tts')
  async getTTS(
    @Query('model') model: string,
    @Query('pitch') pitch: string,
    @Body() body: ttsMessage,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('Authorization') auth?: string,
  ) {
    const ttsFilePath = await this.appService.getTTS(model, pitch, body, auth);

    if (!ttsFilePath || typeof ttsFilePath !== 'string') {
      // If ttsFilePath is not a string, it means an error occurred
      res.status(400).send(ttsFilePath || 'Error generating TTS');
      return;
    }

    const path = ttsFilePath;
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers['range'];

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(path, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(path).pipe(res);
    }
  }
}
