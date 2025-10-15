import { createLogger } from '../log';

const logger = createLogger('SpeechToText');

export class SpeechToTextService {
  static async create(_providers: Record<string, unknown>): Promise<SpeechToTextService> {
    return new SpeechToTextService();
  }

  async transcribeAudio(_base64Audio: string): Promise<string> {
    logger.info('Speech-to-text not configured; returning empty transcription');
    return '';
  }
}