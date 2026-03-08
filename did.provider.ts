import { VideoProvider, VideoGenerationInput, VideoGenerationResult } from './video.interface';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

export class DIDVideoProvider implements VideoProvider {
  private apiKey: string;
  private model: string;
  private outputDir: string;
  private baseUrl = 'https://api.d-id.com';

  constructor(apiKey: string, model?: string, outputDir?: string) {
    this.apiKey = apiKey;
    this.model = model || 'talks';
    this.outputDir = outputDir || path.join(os.tmpdir(), 'loopvybz-videos');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(this.apiKey).toString('base64')}`;
  }

  private async poll(url: string, maxAttempts = 90, intervalMs = 3000): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await fetch(url, {
        headers: { 'Authorization': this.getAuthHeader() },
      });
      const data = await res.json() as any;
      
      if (data.status === 'done') return data;
      if (data.status === 'error' || data.status === 'rejected') {
        throw new Error(`D-ID generation failed: ${data.error?.description || data.reject_reason || JSON.stringify(data)}`);
      }
      
      console.log(`[D-ID] Poll ${i + 1}/${maxAttempts}: status=${data.status}`);
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error('D-ID generation timed out after polling');
  }

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const id = Date.now().toString();
    const mp4Path = path.join(this.outputDir, `${id}.mp4`);
    const thumbPath = path.join(this.outputDir, `${id}_thumb.jpg`);
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';

    if (!input.sourceImageUrl) {
      throw new Error('D-ID requires a source image (anchor face). No sourceImageUrl provided.');
    }

    console.log(`[D-ID] Creating talk with image: ${input.sourceImageUrl}`);
    console.log(`[D-ID] Script length: ${input.script.length} chars`);

    // D-ID Talks API: animate a face image with text-to-speech
    // The generation service will later merge ElevenLabs audio on top,
    // so we use D-ID's built-in TTS just to drive the lip sync.
    // We pick a neutral voice — the final audio track gets replaced.
    const talkPayload: any = {
      source_url: input.sourceImageUrl,
      script: {
        type: 'text',
        input: input.script.slice(0, 5000),
        provider: {
          type: 'microsoft',
          voice_id: 'en-US-GuyNeural',
        },
      },
      config: {
        result_format: 'mp4',
        stitch: true,
      },
    };

    const createRes = await fetch(`${this.baseUrl}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(talkPayload),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`D-ID create talk failed (${createRes.status}): ${err}`);
    }

    const createData = await createRes.json() as any;
    const talkId = createData.id;
    console.log(`[D-ID] Talk created: ${talkId}`);

    // Poll until complete
    const result = await this.poll(`${this.baseUrl}/talks/${talkId}`);
    const resultUrl = result.result_url;

    if (!resultUrl) {
      throw new Error('D-ID talk completed but no result_url returned');
    }

    console.log(`[D-ID] Talk complete, downloading: ${resultUrl}`);

    // Download result
    const videoRes = await fetch(resultUrl);
    if (!videoRes.ok) {
      throw new Error(`Failed to download D-ID video: ${videoRes.status}`);
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    fs.writeFileSync(mp4Path, videoBuffer);

    // Get actual duration from the file
    let duration = input.durationSeconds || 15;
    try {
      const probe = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mp4Path}"`,
        { encoding: 'utf8' }
      ).trim();
      const d = parseFloat(probe);
      if (d > 0) duration = Math.round(d);
    } catch {}

    // Generate thumbnail from ~2s in
    try {
      const ss = Math.min(2, duration - 1);
      execSync(
        `${ffmpeg} -y -i "${mp4Path}" -ss ${ss} -frames:v 1 -q:v 2 "${thumbPath}"`,
        { stdio: 'pipe', timeout: 10000 }
      );
    } catch {
      try {
        execSync(`${ffmpeg} -y -i "${mp4Path}" -frames:v 1 -q:v 2 "${thumbPath}"`, { stdio: 'pipe', timeout: 10000 });
      } catch {
        fs.writeFileSync(thumbPath, Buffer.alloc(0));
      }
    }

    console.log(`[D-ID] Video saved: ${mp4Path} (${duration}s, ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

    return {
      mp4FilePath: mp4Path,
      thumbnailFilePath: thumbPath,
      durationSeconds: duration,
    };
  }
}
