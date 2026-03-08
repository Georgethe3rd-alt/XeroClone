import { VideoProvider, VideoGenerationInput, VideoGenerationResult } from './video.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Runway ML Video Provider (direct API)
 * Uses image_to_video endpoint with source article image
 * Docs: https://docs.dev.runwayml.com
 */
export class RunwayVideoProvider implements VideoProvider {
  private apiKey: string;
  private model: string;
  private outputDir: string;

  constructor(apiKey: string, model = 'gen4_turbo') {
    this.apiKey = apiKey;
    this.model = model;
    this.outputDir = path.join(os.tmpdir(), 'caribbean-news-videos');
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
  }

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const id = Date.now().toString();
    const duration = Math.min(Math.max(input.durationSeconds || 5, 2), 10);

    if (!input.sourceImageUrl) {
      throw new Error('Runway requires a source image (promptImage). No image found in story.');
    }

    const body: any = {
      model: this.model,
      promptText: (input.videoPrompt || input.headline || 'A news broadcast').substring(0, 1000),
      promptImage: input.sourceImageUrl,
      ratio: '720:1280',
      duration,
    };

    console.log(`[Runway] Creating task: model=${this.model}, duration=${duration}s, image=${input.sourceImageUrl.substring(0, 80)}...`);

    const createRes = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Runway create failed: ${createRes.status} ${errText}`);
    }

    const task = await createRes.json();
    const taskId = task.id;
    if (!taskId) throw new Error('Runway: no task id returned');

    console.log(`[Runway] Task created: ${taskId}, polling for result...`);

    const videoUrl = await this.pollForResult(taskId, 300000);

    console.log(`[Runway] Video ready: ${videoUrl}`);

    const mp4Path = path.join(this.outputDir, `${id}.mp4`);
    const thumbPath = path.join(this.outputDir, `${id}_thumb.jpg`);
    await this.downloadFile(videoUrl, mp4Path);
    await this.generateThumbnail(mp4Path, thumbPath, duration);

    return { mp4FilePath: mp4Path, thumbnailFilePath: thumbPath, durationSeconds: duration };
  }

  private async pollForResult(taskId: string, timeoutMs: number): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 5000));
      const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });
      const data = await res.json();
      console.log(`[Runway] Poll status: ${data.status}`);
      if (data.status === 'SUCCEEDED') {
        const url = data.output?.[0];
        if (url) return url;
        throw new Error('Runway: succeeded but no output URL');
      }
      if (data.status === 'FAILED') throw new Error(`Runway generation failed: ${data.failure || data.failureCode || 'unknown'}`);
    }
    throw new Error('Runway: generation timed out after 5 minutes');
  }

  private async downloadFile(url: string, dest: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
  }

  private async generateThumbnail(mp4Path: string, thumbPath: string, duration: number) {
    try {
      const { execSync } = require('child_process');
      execSync(`ffmpeg -y -i "${mp4Path}" -ss ${Math.floor(duration / 2)} -frames:v 1 -q:v 2 "${thumbPath}"`, { stdio: 'pipe' });
    } catch {
      fs.writeFileSync(thumbPath, Buffer.alloc(0));
    }
  }
}
