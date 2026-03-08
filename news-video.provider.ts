import { VideoProvider, VideoGenerationInput, VideoGenerationResult } from './video.interface';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';
import * as https from 'https';
import * as http from 'http';

/**
 * LoopVybz News Video Provider
 * Creates professional branded news videos using:
 * - Story OG images as hero backgrounds with Ken Burns effect
 * - LoopVybz branded overlays (logo bar, breaking news, ticker, category)
 * - ElevenLabs TTS audio (handled by generation service post-merge)
 * 
 * Zero API cost, generates in seconds, looks professional.
 */
export class NewsVideoProvider implements VideoProvider {
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(os.tmpdir(), 'loopvybz-videos');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private async downloadImage(url: string, dest: string): Promise<boolean> {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(dest);
      protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Follow redirect
          const loc = res.headers.location;
          if (loc) {
            this.downloadImage(loc, dest).then(resolve);
            return;
          }
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      }).on('error', () => { resolve(false); });
    });
  }

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const id = Date.now().toString();
    const heroImgPath = path.join(this.outputDir, `${id}_hero.jpg`);
    const scaledImgPath = path.join(this.outputDir, `${id}_scaled.jpg`);
    const videoOnlyPath = path.join(this.outputDir, `${id}_video.mp4`);
    const mp4Path = path.join(this.outputDir, `${id}.mp4`);
    const thumbPath = path.join(this.outputDir, `${id}_thumb.jpg`);
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';

    // Sanitize headline for ffmpeg drawtext
    const rawHeadline = (input.headline || 'LoopVybz News').replace(/['"\\:]/g, ' ');
    // Word-wrap headline into 2 lines max ~25 chars each
    const words = rawHeadline.split(' ');
    let line1 = '';
    let line2 = '';
    for (const word of words) {
      if (line1.length + word.length + 1 <= 28) {
        line1 += (line1 ? ' ' : '') + word;
      } else if (line2.length + word.length + 1 <= 28) {
        line2 += (line2 ? ' ' : '') + word;
      }
    }
    if (!line2) {
      // Short headline — center it
      line2 = '';
    }

    // Find font
    const fontPaths = [
      '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/noto/NotoSans-Bold.ttf',
    ];
    const fontFile = fontPaths.find(p => fs.existsSync(p)) || '';
    if (!fontFile) {
      console.warn('[NewsVideo] No font found, text overlays will be missing');
    }

    // Duration — estimate from script length (~150 words/min speaking rate)
    const wordCount = (input.script || '').split(/\s+/).length;
    let duration = Math.max(Math.ceil(wordCount / 2.5) + 2, 15); // ~2.5 words/sec + 2s padding
    duration = Math.min(duration, 120); // cap at 2 min

    // Download hero image if URL provided
    let hasHeroImage = false;
    if (input.sourceImageUrl) {
      if (input.sourceImageUrl.startsWith('data:')) {
        // base64 data URI — decode to file
        try {
          const match = input.sourceImageUrl.match(/^data:image\/\w+;base64,(.+)$/);
          if (match) {
            fs.writeFileSync(heroImgPath, Buffer.from(match[1], 'base64'));
            hasHeroImage = true;
          }
        } catch (e) {
          console.warn('[NewsVideo] Failed to decode data URI');
        }
      } else {
        hasHeroImage = await this.downloadImage(input.sourceImageUrl, heroImgPath);
      }
      if (hasHeroImage) {
        console.log('[NewsVideo] Downloaded hero image');
        // Scale to 1080x1920 with crop/pad for vertical
        try {
          execSync(
            `${ffmpeg} -y -i "${heroImgPath}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" -q:v 2 "${scaledImgPath}"`,
            { stdio: 'pipe', timeout: 15000 }
          );
        } catch {
          // Fallback: just pad with blur
          try {
            execSync(
              `${ffmpeg} -y -i "${heroImgPath}" -vf "split[original][bg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=20[blurred];[blurred][original]overlay=(W-w)/2:(H-h)/2" -q:v 2 "${scaledImgPath}"`,
              { stdio: 'pipe', timeout: 15000 }
            );
          } catch {
            // Last resort: just resize
            execSync(
              `${ffmpeg} -y -i "${heroImgPath}" -vf "scale=1080:1920" -q:v 2 "${scaledImgPath}"`,
              { stdio: 'pipe', timeout: 15000 }
            );
          }
        }
      }
    }

    // Build the video
    try {
      let inputArgs: string;
      let baseFilter: string;

      if (hasHeroImage) {
        // Ken Burns: slow zoom from 1.0x to 1.15x over duration
        inputArgs = `-loop 1 -i "${scaledImgPath}"`;
        baseFilter = `zoompan=z='min(zoom+0.0005,1.15)':d=${duration * 30}:s=1080x1920:fps=30,format=yuv420p`;
      } else {
        // No image — dark gradient background
        inputArgs = `-f lavfi -i "color=c=0x0f172a:size=1080x1920:duration=${duration}:rate=30"`;
        baseFilter = `format=yuv420p`;
      }

      // Build overlay filters
      const overlays: string[] = [];

      if (fontFile) {
        // === TOP BAR: Dark navy with LOOP(red) + VYBZ(gold) ===
        overlays.push(`drawbox=x=0:y=0:w=iw:h=100:color=0x0a0a1a@0.95:t=fill`);
        overlays.push(`drawbox=x=0:y=98:w=iw:h=3:color=0xFFD600@0.9:t=fill`);
        overlays.push(`drawtext=text='LOOP':fontsize=46:fontcolor=0xef4444:x=40:y=26:fontfile='${fontFile}'`);
        overlays.push(`drawtext=text='VYBZ':fontsize=46:fontcolor=0xFFD600:x=172:y=26:fontfile='${fontFile}'`);

        // === LIVE indicator (pulses) ===
        overlays.push(`drawtext=text='● LIVE':fontsize=24:fontcolor=0xef4444:x=w-140:y=38:fontfile='${fontFile}':enable='lt(mod(t\\,2)\\,1.4)'`);

        // === DARK GRADIENT at bottom for text readability ===
        overlays.push(`drawbox=x=0:y=ih-700:w=iw:h=700:color=0x000000@0.7:t=fill`);

        // === BREAKING NEWS bar (red, slides in after 0.5s) ===
        overlays.push(`drawbox=x=0:y=ih-620:w=iw:h=60:color=0xef4444@0.95:t=fill:enable='gt(t\\,0.5)'`);
        overlays.push(`drawtext=text='BREAKING NEWS':fontsize=32:fontcolor=white:x=(w-text_w)/2:y=h-608:fontfile='${fontFile}':enable='gt(t\\,0.5)'`);

        // === HEADLINE (large, 2 lines, fades in) ===
        const headlineY1 = 'h-520';
        overlays.push(`drawtext=text='${line1}':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=${headlineY1}:fontfile='${fontFile}':alpha='if(lt(t\\,1.5)\\,0\\,min((t-1.5)*2\\,1))'`);
        if (line2) {
          overlays.push(`drawtext=text='${line2}':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=${headlineY1}+60:fontfile='${fontFile}':alpha='if(lt(t\\,1.5)\\,0\\,min((t-1.5)*2\\,1))'`);
        }

        // === Category badge (teal pill) ===
        const category = (input.videoPrompt?.match(/category[:\s]+(\w+)/i)?.[1] || 'NEWS').toUpperCase();
        overlays.push(`drawbox=x=40:y=ih-380:w=220:h=44:color=0xFFD600:t=fill`);
        overlays.push(`drawtext=text='${category}':fontsize=22:fontcolor=0x000000:x=80:y=h-370:fontfile='${fontFile}'`);

        // === Scrolling ticker at very bottom ===
        overlays.push(`drawbox=x=0:y=ih-100:w=iw:h=100:color=0x000000@0.85:t=fill`);
        overlays.push(`drawtext=text='LoopVybz  ●  Caribbean News That Moves You  ●  loopvybz.com  ●  ':fontsize=24:fontcolor=0xFFD600:x='w-mod(t*120\\,w+tw)':y=h-62:fontfile='${fontFile}'`);

        // === Thin animated accent line ===
        overlays.push(`drawbox=x=0:y=ih-700:w=iw:h=3:color=0xFFD600@0.8:t=fill`);
      }

      const filterComplex = overlays.length > 0
        ? `${baseFilter},${overlays.join(',')}`
        : baseFilter;

      const cmd = [
        ffmpeg, '-y',
        inputArgs,
        `-vf "${filterComplex}"`,
        `-t ${duration}`,
        '-c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p',
        `"${mp4Path}"`,
      ].join(' ');

      console.log(`[NewsVideo] Generating ${duration}s video with ${hasHeroImage ? 'hero image + Ken Burns' : 'solid background'}`);
      execSync(cmd, { stdio: 'pipe', timeout: 120000 });
      console.log('[NewsVideo] Video rendered successfully');

    } catch (err: any) {
      console.error('[NewsVideo] Render failed:', err.message?.slice(0, 300));
      // Absolute fallback — solid color
      execSync(
        `${ffmpeg} -y -f lavfi -i color=c=0x0f172a:size=1080x1920:duration=${duration}:rate=25 -t ${duration} -c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p "${mp4Path}"`,
        { stdio: 'pipe', timeout: 30000 }
      );
    }

    // Generate thumbnail at 2s
    try {
      const ss = Math.min(2, duration - 1);
      execSync(`${ffmpeg} -y -i "${mp4Path}" -ss ${ss} -frames:v 1 -q:v 2 "${thumbPath}"`, { stdio: 'pipe', timeout: 10000 });
    } catch {
      try {
        execSync(`${ffmpeg} -y -i "${mp4Path}" -frames:v 1 -q:v 2 "${thumbPath}"`, { stdio: 'pipe', timeout: 10000 });
      } catch {
        fs.writeFileSync(thumbPath, Buffer.alloc(0));
      }
    }

    // Cleanup temp files
    try { fs.unlinkSync(heroImgPath); } catch {}
    try { fs.unlinkSync(scaledImgPath); } catch {}
    try { fs.unlinkSync(videoOnlyPath); } catch {}

    const fileSize = fs.existsSync(mp4Path) ? fs.statSync(mp4Path).size : 0;
    console.log(`[NewsVideo] Done: ${mp4Path} (${duration}s, ${(fileSize / 1024 / 1024).toFixed(1)}MB)`);

    return {
      mp4FilePath: mp4Path,
      thumbnailFilePath: thumbPath,
      durationSeconds: duration,
    };
  }
}
