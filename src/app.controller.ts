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
    @Query('language') language: string,
    @Query('model') model: string,
    @Query('pitch') pitch: string,
    @Body() body: ttsMessage,
    @Res({ passthrough: true }) response?: Response,
    @Headers('Authorization') auth?: string,
  ): Promise<StreamableFile | string> {
    // return await this.appService.getTTS(model, pitch, body, response, auth);

    const ttsResult = await this.appService.getTTS(language, model, pitch, body, response, auth);

    if (ttsResult instanceof StreamableFile) {
      response.setHeader('Content-Type', 'audio/mpeg');
    }

    return ttsResult;
  }
}
