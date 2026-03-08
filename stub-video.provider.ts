import { VideoProvider, VideoGenerationInput, VideoGenerationResult } from './video.interface';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

export class StubVideoProvider implements VideoProvider {
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(os.tmpdir(), 'loopvybz-videos');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const id = Date.now().toString();
    const videoOnlyPath = path.join(this.outputDir, `${id}_video.mp4`);
    const audioPath = path.join(this.outputDir, `${id}_audio.mp3`);
    const mp4Path = path.join(this.outputDir, `${id}.mp4`);
    const thumbPath = path.join(this.outputDir, `${id}_thumb.jpg`);
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';

    const headline = (input.headline || 'LoopVybz News')
      .replace(/'/g, "'\\\\\\''")
      .replace(/[:\\\"]/g, ' ')
      .slice(0, 45);

    const shortHeadline = headline.length > 28 ? headline.slice(0, 28) + '...' : headline;

    // Find font
    const fontPaths = [
      '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/noto/NotoSans-Bold.ttf',
    ];
    const fontFile = fontPaths.find(p => fs.existsSync(p)) || '';

    // 1. Generate TTS audio from script
    let hasAudio = false;
    const script = input.script || '';
    if (script) {
      hasAudio = await this.generateTTS(script, audioPath);
    }

    // Get audio duration to match video length
    let duration = input.durationSeconds || 15;
    if (hasAudio) {
      try {
        const probe = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`, { encoding: 'utf8' }).trim();
        const audioDur = parseFloat(probe);
        if (audioDur > 0) duration = Math.ceil(audioDur) + 2; // pad 2 sec
      } catch {}
    }

    // 2. Generate video with animated elements
    try {
      const filters = fontFile ? [
        // Teal top bar
        `drawbox=x=0:y=0:w=iw:h=90:color=0xFFD600@0.95:t=fill`,
        `drawtext=text='LOOPVYBZ':fontsize=42:fontcolor=0x000000:x=(w-text_w)/2:y=24:fontfile='${fontFile}'`,
        // LIVE pulse (blinks)
        `drawtext=text='● LIVE':fontsize=28:fontcolor=0xef4444:x=60:y=140:fontfile='${fontFile}':enable='lt(mod(t\\,2)\\,1.5)'`,
        // Time counter
        `drawtext=text='%{pts\\:hms}':fontsize=22:fontcolor=0x94a3b8:x=w-160:y=146:fontfile='${fontFile}'`,
        // Breaking news red banner - slides in
        `drawbox=x=0:y=680:w=iw:h=70:color=0xef4444@0.95:t=fill:enable='gt(t\\,0.5)'`,
        `drawtext=text='BREAKING NEWS':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=698:fontfile='${fontFile}':enable='gt(t\\,0.5)'`,
        // Dark headline area
        `drawbox=x=0:y=770:w=iw:h=320:color=0x000000@0.75:t=fill`,
        // Headline text - fades in
        `drawtext=text='${shortHeadline}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=880:fontfile='${fontFile}':alpha='if(lt(t\\,1)\\,t\\,1)'`,
        // Animated scroll ticker at bottom
        `drawbox=x=0:y=1810:w=iw:h=110:color=0x000000@0.85:t=fill`,
        `drawtext=text='LoopVybz  ●  Caribbean News That Moves You  ●  Stay Informed  ●  ':fontsize=26:fontcolor=0xFFD600:x='w-mod(t*150\\,w+tw)':y=1848:fontfile='${fontFile}'`,
        // Category badge
        `drawbox=x=40:y=1710:w=240:h=48:color=0xFFD600:t=fill`,
        `drawtext=text='CARIBBEAN NEWS':fontsize=22:fontcolor=0x000000:x=70:y=1722:fontfile='${fontFile}'`,
        // Subtle animated gradient overlay for visual interest
        `drawbox=x=0:y='ih/2+ih/4*sin(t)':w=iw:h=3:color=0xFFD600@0.3:t=fill`,
      ].join(',') : '';

      const cmd = [
        ffmpeg, '-y',
        '-f', 'lavfi',
        '-i', `color=c=0x0f172a:size=1080x1920:duration=${duration}:rate=30`,
        ...(filters ? ['-vf', `"${filters}"`] : []),
        '-t', String(duration),
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-pix_fmt', 'yuv420p',
        `"${videoOnlyPath}"`,
      ].join(' ');

      execSync(cmd, { stdio: 'pipe', timeout: 60000 });
    } catch (err) {
      console.warn('[StubVideo] Video render failed:', err.message?.slice(0, 200));
      // Fallback plain
      execSync(`${ffmpeg} -y -f lavfi -i color=c=0x1e293b:size=1080x1920:duration=${duration}:rate=25 -t ${duration} -c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p "${videoOnlyPath}"`, { stdio: 'pipe', timeout: 30000 });
    }

    // 3. Merge video + audio
    if (hasAudio) {
      try {
        execSync(`${ffmpeg} -y -i "${videoOnlyPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 128k -shortest "${mp4Path}"`, { stdio: 'pipe', timeout: 30000 });
        console.log('[StubVideo] Merged video + TTS audio');
      } catch (err) {
        console.warn('[StubVideo] Audio merge failed, using video only:', err.message?.slice(0, 100));
        fs.copyFileSync(videoOnlyPath, mp4Path);
      }
    } else {
      fs.copyFileSync(videoOnlyPath, mp4Path);
    }

    // 4. Thumbnail
    try {
      execSync(`${ffmpeg} -y -i "${mp4Path}" -ss 2 -frames:v 1 -q:v 2 "${thumbPath}"`, { stdio: 'pipe', timeout: 10000 });
    } catch {
      fs.writeFileSync(thumbPath, Buffer.alloc(0));
    }

    // Cleanup temp files
    try { fs.unlinkSync(videoOnlyPath); } catch {}
    try { fs.unlinkSync(audioPath); } catch {}

    return { mp4FilePath: mp4Path, thumbnailFilePath: thumbPath, durationSeconds: duration };
  }

  private async generateTTS(text: string, outPath: string): Promise<boolean> {
    // Try OpenAI TTS first (check if key is in env or settings)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text.slice(0, 4096),
            voice: 'onyx', // deep, authoritative news voice
            response_format: 'mp3',
          }),
        });
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(outPath, buffer);
          console.log('[StubVideo] Generated TTS audio via OpenAI');
          return true;
        }
        console.warn('[StubVideo] OpenAI TTS failed:', res.status);
      } catch (err) {
        console.warn('[StubVideo] OpenAI TTS error:', err.message);
      }
    }

    // Try ElevenLabs
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9';
    if (elevenKey) {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.slice(0, 2000),
            model_id: 'eleven_turbo_v2_5',
          }),
        });
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(outPath, buffer);
          console.log('[StubVideo] Generated TTS audio via ElevenLabs');
          return true;
        }
      } catch {}
    }

    console.warn('[StubVideo] No TTS available, video will have no audio');
    return false;
  }
}
