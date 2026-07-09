import { spawn } from 'child_process';

import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface WhisperResult {
  text: string;
}

export const runWhisper = async (
  audioPath: string,
  outputDir: string
): Promise<WhisperResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      config.whisper.pythonBin,
      [
        '-m',
        'whisper',
        audioPath,
        '--model',
        config.whisper.model,
        '--output_format',
        'txt',
        '--output_dir',
        outputDir,
        '--fp16',
        'False',
      ],
      {
        env: {
          ...process.env,
          PYTHONUTF8: '1',
        },
      }
    );

    let stderr = '';

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(
        ApiError.internal(
          `Failed to start Whisper: ${err.message}`
        )
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log("Whisper process finished.");
        console.log("Exit code:", code);
        console.log("stderr:");
        console.log(stderr);
        resolve({ text: '' });
      } else {
        reject(
          ApiError.internal(
            `Whisper failed:\n${stderr}`
          )
        );
      }
    });
  });
};