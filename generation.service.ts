import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../providers/storage/s3.service';
import { LLMProvider } from '../providers/llm/llm.interface';
import { VideoProvider } from '../providers/video/video.interface';
import { OpenAIProvider } from '../providers/llm/openai.provider';
import { StubLLMProvider } from '../providers/llm/stub.provider';
import { StubVideoProvider } from '../providers/video/stub-video.provider';
import { KlingVideoProvider } from '../providers/video/kling.provider';
import { LumaVideoProvider } from '../providers/video/luma.provider';
import { RunwayVideoProvider } from '../providers/video/runway.provider';
import { FalVideoProvider } from '../providers/video/fal.provider';
import { DIDVideoProvider } from '../providers/video/did.provider';
import { NewsVideoProvider } from '../providers/video/news-video.provider';
import { CharactersService } from '../characters/characters.service';
import { AnalyticsService } from '../analytics/analytics.service';


const CATEGORY_VOICE_STYLES: Record<string, string> = {
  'Politics': 'Authoritative and measured tone. Clear enunciation. Serious delivery.',
  'Sports': 'Energetic and exciting. Quick pace. Enthusiastic delivery.',
  'Crime': 'Serious and somber tone. Steady pace. Factual delivery.',
  'Culture': 'Warm and conversational. Relaxed pace. Engaging storytelling.',
  'Economy': 'Professional and analytical. Moderate pace. Confident delivery.',
  'Environment': 'Thoughtful and concerned. Moderate pace. Earnest delivery.',
  'Technology': 'Modern and forward-looking. Upbeat pace. Curious delivery.',
  'Health': 'Caring and informative. Clear pace. Reassuring delivery.',
  'General': 'Professional news anchor tone. Standard pace.',
};

@Injectable()
export class GenerationService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private charactersService: CharactersService,
    private analyticsService: AnalyticsService,
  ) {}
  private sanitizeVideoPrompt(prompt: string): string {
    const replacements: Record<string, string> = {
      'demolition': 'dominant performance', 'demolish': 'dominate',
      'attack': 'strategy', 'attacking': 'strategic',
      'blast': 'hit', 'destroy': 'defeat', 'destroying': 'defeating',
      'crush': 'overcome', 'crushing': 'overcoming',
      'kill': 'stop', 'killing': 'stopping',
      'war': 'competition', 'battle': 'match',
      'fight': 'contest', 'fighting': 'contesting',
      'strike': 'action', 'striking': 'active',
      'bomb': 'surprise', 'explode': 'surge', 'explosion': 'surge',
      'violence': 'intensity', 'violent': 'intense',
      'dies': 'passes away', 'died': 'passed away', 'dead': 'late',
      'death': 'passing', 'murder': 'incident', 'murdered': 'lost',
      'shot': 'hit', 'shooting': 'incident', 'gun': 'weapon',
      'stab': 'incident', 'stabbed': 'injured',
      'blood': 'aftermath', 'bloody': 'dramatic',
      'victim': 'person', 'victims': 'people affected',
      'suspect': 'individual', 'crime': 'incident',
      'arrest': 'apprehension', 'arrested': 'apprehended',
      'manhunt': 'search', 'fugitive': 'person sought',
    };

    let sanitized = prompt;
    for (const [bad, good] of Object.entries(replacements)) {
      const regex = new RegExp(bad, 'gi');
      sanitized = sanitized.replace(regex, good);
    }
    console.log('[Generation] Sanitized video prompt');
    return sanitized;
  }


  private getLLMProvider(settings: any): LLMProvider {
    if (!settings?.llm_api_key) {
      console.warn('[Generation] No LLM API key configured, using stub provider');
      return new StubLLMProvider();
    }

    const provider = settings.llm_provider || 'openai';

    switch (provider) {
      case 'openai':
        return new OpenAIProvider(settings.llm_api_key, settings.llm_model);
      case 'anthropic':
        return this.createAnthropicAdapter(settings.llm_api_key, settings.llm_model);
      case 'gemini':
        return this.createGeminiAdapter(settings.llm_api_key, settings.llm_model);
      case 'groq':
        // Groq uses OpenAI-compatible API
        return new OpenAIProvider(settings.llm_api_key, settings.llm_model, 'https://api.groq.com/openai/v1');
      case 'mistral':
        // Mistral uses OpenAI-compatible API
        return new OpenAIProvider(settings.llm_api_key, settings.llm_model, 'https://api.mistral.ai/v1');
      default:
        console.warn(`[Generation] Unknown LLM provider: ${provider}, using stub`);
        return new StubLLMProvider();
    }
  }

  private createAnthropicAdapter(apiKey: string, model: string): LLMProvider {
    return {
      async generateFromStory(rawText: string, tone: string, opts: any) {
        const customInstructions = opts?.llmInstructions ? `\nAdditional instructions: ${opts.llmInstructions}` : '';
        const systemPrompt = `You are a LoopVybz video script writer. Generate a short video script from the article below. Tone: ${tone}. Max ${opts?.maxWords || 90} words.${customInstructions}
Return JSON: {"script":"...","videoPrompt":"...","captions":"...","suggestedHeadline":"...","suggestedCategory":"...","suggestedTags":["..."],"flags":[]}
videoPrompt should describe a vertical 1080x1920 news video visual. suggestedCategory must be one of: Politics, Sports, Culture, Economy, Crime, Environment, Technology, Health, General.`;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: 'user', content: `Title: ${opts?.title}\n\nArticle:\n${rawText.slice(0, 4000)}` }],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(`Anthropic error: ${err.error?.message || res.status}`);
        }

        const data = await res.json();
        const text = data.content?.[0]?.text || '';
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch {}
        return { script: text, videoPrompt: '', captions: text, suggestedHeadline: opts?.title, suggestedCategory: 'General', suggestedTags: ['#caribbean', '#news'], flags: [] };
      },
    };
  }

  private createGeminiAdapter(apiKey: string, model: string): LLMProvider {
    return {
      async generateFromStory(rawText: string, tone: string, opts: any) {
        const customInstructions = opts?.llmInstructions ? `\nAdditional instructions: ${opts.llmInstructions}` : '';
        const prompt = `You are a LoopVybz video script writer. Generate a short video script from the article below. Tone: ${tone}. Max ${opts?.maxWords || 90} words.${customInstructions}
Return JSON only: {"script":"...","videoPrompt":"...","captions":"...","suggestedHeadline":"...","suggestedCategory":"...","suggestedTags":["..."],"flags":[]}
videoPrompt should describe a vertical 1080x1920 news video visual. suggestedCategory must be one of: Politics, Sports, Culture, Economy, Crime, Environment, Technology, Health, General.

Title: ${opts?.title}
Article:
${rawText.slice(0, 4000)}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1000 },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(`Gemini error: ${err.error?.message || res.status}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch {}
        return { script: text, videoPrompt: '', captions: text, suggestedHeadline: opts?.title, suggestedCategory: 'General', suggestedTags: ['#caribbean', '#news'], flags: [] };
      },
    };
  }


  private async getSourceImageWithFallback(story: any): Promise<string | undefined> {
    const ogMatch = story.raw_html?.match(/og:image[^>]*content="([^"]+)"/);
    if (ogMatch) {
      let url = ogMatch[1].replace(/&amp;/g, '&');
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      console.log('[Generation] Using OG image:', url);
      return url;
    }

    const twitterMatch = story.raw_html?.match(/twitter:image[^>]*content="([^"]+)"/);
    if (twitterMatch) {
      let url = twitterMatch[1].replace(/&amp;/g, '&');
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      console.log('[Generation] Using Twitter image:', url);
      return url;
    }

    const imgMatch = story.raw_html?.match(/<img[^>]+(src|data-src)="([^"]+)"[^>]*>/);
    if (imgMatch) {
      let url = imgMatch[2].replace(/&amp;/g, '&');
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      if (!url.includes('pixel') && !url.includes('1x1')) {
        console.log('[Generation] Using first img tag:', url);
        return url;
      }
    }

    console.log('[Generation] No source image found, using fallback');
    const fallbackUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=720&h=1280&fit=crop';
    return fallbackUrl;
  }

  /**
   * Download an image and serve it from our API so Runway can fetch it
   * (some CDNs don't return Content-Length which Runway requires)
   */
  private async proxyImageForRunway(imageUrl: string, postId: string): Promise<string> {
    const axios = require('axios');
    
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64 = Buffer.from(response.data).toString('base64');
      const dataUri = 'data:' + contentType + ';base64,' + base64;
      console.log('[Generation] Converted image to base64 data URI (' + Math.round(base64.length / 1024) + 'KB)');
      return dataUri;
    } catch (err) {
      console.warn('[Generation] Failed to proxy image: ' + err.message + ', using original URL');
      return imageUrl;
    }
  }

    private getVideoProvider(settings: any): VideoProvider {
    const provider = settings?.video_provider || 'stub';
    const apiKey = settings?.video_api_key;
    const model = settings?.video_model;

    if (provider === 'news-video') {
      return new NewsVideoProvider();
    }
    if (!apiKey || provider === 'stub') {
      return new StubVideoProvider();
    }

    switch (provider) {
      case 'kling':
        return new KlingVideoProvider(apiKey, model || 'fal-ai/kling-video/v2/master/text-to-video');
      case 'luma':
        return new LumaVideoProvider(apiKey, model || 'ray-2');
      case 'runway':
        return new RunwayVideoProvider(apiKey, model || 'gen4_turbo');
      case 'fal':
        return new FalVideoProvider(apiKey, model || 'fal-ai/kling-video/v2/master/text-to-video');
      case 'd-id':
        return new DIDVideoProvider(apiKey, model || 'talks');
      case 'news-video':
        return new NewsVideoProvider();
      default:
        console.warn(`[Generation] Unknown video provider: ${provider}, using stub`);
        return new StubVideoProvider();
    }
  }

  private async generateTTSAudio(script: string, outputPath: string, voiceOverride?: { provider?: string; voice?: string; model?: string }, audioInstructions?: string, category?: string): Promise<boolean> {
    const settings = await this.prisma.settings.findFirst();
    
    if (!settings?.audio_api_key || settings.audio_provider === 'none') {
      console.warn("[Generation] No audio API key configured or provider is none, skipping TTS");
      return false;
    }

    const provider = voiceOverride?.provider || settings.audio_provider || 'openai';
    const model = voiceOverride?.model || settings.audio_model || 'tts-1';
    const voice = voiceOverride?.voice || settings.audio_voice || 'onyx';
    const apiKey = settings.audio_api_key;
    
    console.log(`[Generation] TTS config: provider=${provider}, model=${model}, voice=${voice}${voiceOverride ? ' (anchor override)' : ' (global default)'}`);

    try {
      let buffer: Buffer;

      if (provider === 'openai') {
        const res = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input: (() => {
              const categoryStyle = category ? (CATEGORY_VOICE_STYLES[category] || CATEGORY_VOICE_STYLES['General']) : '';
              const combined = [categoryStyle, audioInstructions].filter(Boolean).join(' ');
              return (combined ? `[${combined}] ` : '') + script.slice(0, 4096);
            })(),
            voice,
            response_format: "mp3",
          }),
        });

        if (!res.ok) {
          console.warn("[Generation] OpenAI TTS failed:", res.status);
          return false;
        }

        buffer = Buffer.from(await res.arrayBuffer());
        console.log(`[Generation] Generated TTS audio via OpenAI (${model}, ${voice})`);
        
        // Track TTS generation (fire and forget)
        this.analyticsService.trackEvent('tts_generated', null, 'openai', 0.015).catch(e => 
          console.error('[Analytics] Failed to track TTS:', e)
        );
      } else if (provider === 'elevenlabs') {
        const voiceId = voice.split('|')[0];
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: script.slice(0, 5000),
            model_id: model,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn("[Generation] ElevenLabs TTS failed:", res.status, errText);
          return false;
        }

        buffer = Buffer.from(await res.arrayBuffer());
        console.log(`[Generation] Generated TTS audio via ElevenLabs (${model}, ${voiceId})`);
      } else {
        console.warn(`[Generation] Unknown audio provider: ${provider}`);
        return false;
      }

      require("fs").writeFileSync(outputPath, buffer);
      return true;
    } catch (err) {
      console.error("[Generation] TTS error:", err);
      return false;
    }
  }

  private async mergeAudioWithVideo(videoPath: string, audioPath: string, outputPath: string): Promise<boolean> {
    const { execSync } = require("child_process");
    const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";

    try {
      execSync(
        `${ffmpeg} -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`,
        { stdio: "pipe", timeout: 60000 }
      );
      console.log("[Generation] Merged video + TTS audio");
      return true;
    } catch (err) {
      console.error("[Generation] Audio merge failed:", err);
      return false;
    }
  }

  async generateForPost(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { story: true },
    });

    if (!post) throw new Error(`Post ${postId} not found`);
    if (!post.story) throw new Error(`Post ${postId} has no story`);

    const settings = await this.prisma.settings.findFirst();

    const llm = this.getLLMProvider(settings);

    let versionId: string | null = null;

    const startTime = Date.now();

    try {
      // Track generation start
      await this.analyticsService.trackEvent('generation_started', postId, settings?.video_provider);

      // 1. Create a pending GenerationVersion
      const version = await this.prisma.generationVersion.create({
        data: {
          post_id: postId,
          tone: post.tone,
          llm_provider: settings?.llm_provider || 'stub',
          llm_model: settings?.llm_model || 'stub-v1',
          video_provider: settings?.video_provider || 'stub',
          video_model: settings?.video_model || 'stub-v1',
          status: 'GENERATING',
        },
      });
      versionId = version.id;

      // 2. Call LLM
      console.log(`[Generation] Calling LLM (${settings?.llm_provider || 'stub'}) for post ${postId} with tone ${post.tone}`);
      const llmResult = await llm.generateFromStory(
        post.story.raw_text,
        post.tone,
        { maxWords: 90, title: post.story.title, llmInstructions: settings?.llm_instructions || '' },
      );

      // 3. Update version with LLM results
      await this.prisma.generationVersion.update({
        where: { id: version.id },
        data: {
          script_text: llmResult.script,
          video_prompt: llmResult.videoPrompt,
          captions: Array.isArray(llmResult.captions) ? llmResult.captions.join('\n') : String(llmResult.captions || ''),
          flags_json: llmResult.flags as any,
          status: 'VIDEO_GENERATING',
        },
      });


      // 3.5. Match characters and enhance video prompt
      const matchedCharacters = await this.charactersService.matchCharacters(post.story.raw_text);
      const defaultAnchor = await this.charactersService.getDefaultAnchor();
      
      let enhancedVideoPrompt = llmResult.videoPrompt;
      
      // Apply custom video instructions
      if (settings?.video_instructions) {
        enhancedVideoPrompt = `${settings.video_instructions}. ${enhancedVideoPrompt}`;
        console.log('[Generation] Applied custom video instructions');
      }
      const characterIds = [];
      
      // Add anchor description at the beginning
      if (defaultAnchor) {
        characterIds.push(defaultAnchor.id);
        enhancedVideoPrompt = `A professional news anchor ${defaultAnchor.description} presents the following story: ${enhancedVideoPrompt}`;
      }
      
      // Add matched public figures
      for (const character of matchedCharacters) {
        if (!characterIds.includes(character.id)) {
          characterIds.push(character.id);
          enhancedVideoPrompt += ` featuring ${character.name}: ${character.description}`;
        }
      }
      
      console.log(`[Generation] Matched ${matchedCharacters.length} characters + anchor for post ${postId}`);

      // 4. Call Video Provider
      // Smart provider selection: D-ID for talking heads (when we have a face), stub for everything else
      const configuredProvider = settings?.video_provider || 'stub';
      
      // Select the best reference image for video generation
      let sourceImageUrl: string | undefined;
      let imageSource = 'none';
      let effectiveProvider = configuredProvider;

      // 1. Check matched characters for reference images (public figures take priority)
      const matchedWithImages = matchedCharacters.filter(
        (c) => c.image_urls && c.image_urls.length > 0
      );
      if (matchedWithImages.length > 0) {
        // Use the first matched character's image (most relevant to the story)
        sourceImageUrl = matchedWithImages[0].image_urls[0];
        imageSource = `character:${matchedWithImages[0].name}`;
        console.log(`[Generation] Using matched character image: ${matchedWithImages[0].name}`);
        // D-ID works great for recognized faces — use it
        if (configuredProvider === 'd-id') effectiveProvider = 'd-id';
        
        // If multiple matched characters have images, mention them in the prompt
        if (matchedWithImages.length > 1) {
          const names = matchedWithImages.map(c => c.name).join(', ');
          console.log(`[Generation] Additional matched characters with images: ${names}`);
        }
      }
      // 2. No matched character — check for story images and use alt provider (e.g. Runway)
      else if (configuredProvider === 'd-id') {
        // Check if story has its own OG image
        const ogMatch = post.story.raw_html?.match(/og:image[^>]*content="([^"]+)"/);
        const twitterMatch = post.story.raw_html?.match(/twitter:image[^>]*content="([^"]+)"/);
        const storyImage = ogMatch ? ogMatch[1].replace(/&amp;/g, '&') : (twitterMatch ? twitterMatch[1].replace(/&amp;/g, '&') : null);
        
        // Use alt video provider (Runway) if configured
        const altProvider = settings?.video_alt_provider;
        const altApiKey = settings?.video_alt_api_key;
        
        if (storyImage) {
          // Story has image → use news-video provider (branded overlay + Ken Burns on real image)
          sourceImageUrl = storyImage.startsWith('http://') ? storyImage.replace('http://', 'https://') : storyImage;
          imageSource = 'story-image';
          effectiveProvider = 'news-video';
          console.log(`[Generation] No character match, using news-video provider with story image`);
        } else if (defaultAnchor && defaultAnchor.image_urls && defaultAnchor.image_urls.length > 0) {
          // No story image — fall back to anchor talking head
          sourceImageUrl = defaultAnchor.image_urls[0];
          imageSource = 'anchor';
          console.log('[Generation] No story image, using anchor for D-ID talking head');
        }
      }
      // 3. Non-D-ID providers: fall back to default anchor image
      else if (defaultAnchor && defaultAnchor.image_urls && defaultAnchor.image_urls.length > 0) {
        sourceImageUrl = defaultAnchor.image_urls[0];
        imageSource = 'anchor';
        console.log('[Generation] Using anchor image as reference');
      }
      // 4. Fall back to story OG image
      else {
        const ogMatch = post.story.raw_html?.match(/og:image[^>]*content="([^"]+)"/);
        if (ogMatch) {
          sourceImageUrl = ogMatch[1].replace(/&amp;/g, '&');
          if (sourceImageUrl.startsWith('http://')) {
            sourceImageUrl = sourceImageUrl.replace('http://', 'https://');
          }
          imageSource = 'og-image';
        }
        // 5. Try twitter:image
        if (!sourceImageUrl) {
          const twitterMatch = post.story.raw_html?.match(/twitter:image[^>]*content="([^"]+)"/);
          if (twitterMatch) {
            sourceImageUrl = twitterMatch[1].replace(/&amp;/g, '&');
            imageSource = 'twitter-image';
          }
        }
      }
      
      console.log(`[Generation] Provider: ${effectiveProvider} (configured: ${configuredProvider}), Image source: ${imageSource}, URL: ${sourceImageUrl?.substring(0, 80) || 'none'}...`);

      // Get the right video provider instance — use alt API key if switching to alt provider
      const videoSettings = { ...settings, video_provider: effectiveProvider };
      if (effectiveProvider === settings?.video_alt_provider && settings?.video_alt_api_key) {
        videoSettings.video_api_key = settings.video_alt_api_key;
        videoSettings.video_model = settings.video_alt_model || 'gen4_turbo';
      }
      const video = this.getVideoProvider(videoSettings);

      // Proxy image for Runway (CDNs may not return Content-Length)
      // D-ID needs a real URL, not a data URI — skip proxy for D-ID
      const proxiedImageUrl = sourceImageUrl 
        ? (effectiveProvider === 'd-id' ? sourceImageUrl : await this.proxyImageForRunway(sourceImageUrl, postId))
        : undefined;

      const videoResult = await video.generateVideo({
        videoPrompt: this.sanitizeVideoPrompt(enhancedVideoPrompt),
        script: llmResult.script,
        durationSeconds: 15,
        aspectRatio: '9:16',
        headline: llmResult.suggestedHeadline || post.story.title,
        sourceImageUrl: proxiedImageUrl,
      });

      // 4.5. Add TTS audio narration (post-process any video provider)
      const path = require('path');
      const os = require('os');
      const fs = require('fs');
      const audioPath = path.join(os.tmpdir(), `${version.id}_audio.mp3`);
      const videoWithAudioPath = path.join(os.tmpdir(), `${version.id}_final.mp4`);

      // Use anchor's voice if configured, otherwise fall back to global settings
      const anchorVoice = defaultAnchor?.voice_provider && defaultAnchor?.voice_id
        ? { provider: defaultAnchor.voice_provider, voice: defaultAnchor.voice_id, model: defaultAnchor.voice_model || undefined }
        : undefined;
      const hasAudio = await this.generateTTSAudio(llmResult.script, audioPath, anchorVoice, settings?.audio_instructions || '', post.category);
      let finalVideoPath = videoResult.mp4FilePath;

      if (hasAudio) {
        const merged = await this.mergeAudioWithVideo(
          videoResult.mp4FilePath,
          audioPath,
          videoWithAudioPath
        );
        if (merged) {
          // Use the merged video instead of original
          finalVideoPath = videoWithAudioPath;
        }
        // Clean up audio file
        try { fs.unlinkSync(audioPath); } catch {}
      }


      // 5. Upload to S3/local storage
      const key = `videos/${postId}/${version.id}`;
      const mp4Key = `${key}/video.mp4`;
      const thumbKey = `${key}/thumb.jpg`;

      const rawMp4Url = await this.s3.uploadFile(videoResult.mp4FilePath, `${key}/video_raw.mp4`, 'video/mp4');
      const mp4Url = await this.s3.uploadFile(finalVideoPath, mp4Key, 'video/mp4');
      const thumbUrl = await this.s3.uploadFile(videoResult.thumbnailFilePath, thumbKey, 'image/jpeg');

      // Clean up temp merged video
      if (finalVideoPath !== videoResult.mp4FilePath) {
        try { fs.unlinkSync(finalVideoPath); } catch {}
      }

      // 6. Create VideoAsset
      // Generate thumbnail candidates
      const thumbnailPaths = await this.generateThumbnails(finalVideoPath, videoResult.durationSeconds);
      const thumbCandidates: string[] = [];
      
      for (let i = 0; i < thumbnailPaths.length; i++) {
        const candidateKey = `${key}/thumb_${i}.jpg`;
        const candidateUrl = await this.s3.uploadFile(thumbnailPaths[i], candidateKey, 'image/jpeg');
        thumbCandidates.push(candidateUrl);
        try { fs.unlinkSync(thumbnailPaths[i]); } catch {}
      }

      const asset = await this.prisma.videoAsset.create({
        data: {
          mp4_url: mp4Url,
          thumb_url: thumbCandidates[0] || thumbUrl,
          duration_seconds: videoResult.durationSeconds,
          thumb_candidates: thumbCandidates,
        },
      });

      // 7. Finalize version
      await this.prisma.generationVersion.update({
        where: { id: version.id },
        data: {
          video_asset_id: asset.id,
          character_ids: characterIds,
          video_provider: effectiveProvider,
          status: 'COMPLETED',
        },
      });

      // 8. Update post: apply LLM suggestions + set EDITING
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: 'EDITING',
          active_version_id: version.id,
          headline: llmResult.suggestedHeadline || post.headline,
          caption: Array.isArray(llmResult.captions) ? llmResult.captions.join('\n') : String(llmResult.captions || ''),
          category: llmResult.suggestedCategory || post.category,
          tags: llmResult.suggestedTags,
        },
      });

      // Auto-publish breaking news if enabled
      if (post.is_breaking && settings?.auto_publish_breaking) {
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            status: 'LIVE',
            published_at_live: new Date(),
          },
        });
        console.log(`[Breaking] Auto-published post: ${llmResult.suggestedHeadline || post.headline}`);
      }

      // Track completion with timing and estimated credits
      const generationTime = Date.now() - startTime;
      const estimatedCredits = this.estimateCredits(settings?.video_provider || 'stub', videoResult.durationSeconds);
      
      await this.prisma.generationVersion.update({
        where: { id: version.id },
        data: {
          generation_time_ms: generationTime,
          credits_used: estimatedCredits,
        },
      });

      await this.analyticsService.trackEvent(
        'generation_completed',
        postId,
        settings?.video_provider,
        estimatedCredits,
        { duration_seconds: videoResult.durationSeconds, generation_time_ms: generationTime }
      );

      console.log(`[Generation] Success for post ${postId}`);
    } catch (err) {
      console.error(`[Generation] Error for post ${postId}:`, err);

      // Track failure
      await this.analyticsService.trackEvent(
        'generation_failed',
        postId,
        settings?.video_provider,
        0,
        { error: err.message }
      );

      if (versionId) {
        await this.prisma.generationVersion.update({
          where: { id: versionId },
          data: { status: 'FAILED', error: err.message },
        });
      }

      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED' },
      });

      throw err;
    }
  }

  async generateScriptOnly(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { story: true },
    });

    if (!post) throw new Error(`Post ${postId} not found`);
    if (!post.story) throw new Error(`Post ${postId} has no story`);

    const settings = await this.prisma.settings.findFirst();
    const llm = this.getLLMProvider(settings);

    try {
      const version = await this.prisma.generationVersion.create({
        data: {
          post_id: postId,
          tone: post.tone,
          llm_provider: settings?.llm_provider || 'stub',
          llm_model: settings?.llm_model || 'stub-v1',
          video_provider: settings?.video_provider || 'stub',
          video_model: settings?.video_model || 'stub-v1',
          status: 'GENERATING',
        },
      });

      console.log(`[Generation] Generating script only for post ${postId}`);
      const llmResult = await llm.generateFromStory(
        post.story.raw_text,
        post.tone,
        { maxWords: 90, title: post.story.title },
      );

      await this.prisma.generationVersion.update({
        where: { id: version.id },
        data: {
          script_text: llmResult.script,
          video_prompt: llmResult.videoPrompt,
          captions: Array.isArray(llmResult.captions) ? llmResult.captions.join('\n') : String(llmResult.captions || ''),
          flags_json: llmResult.flags as any,
          status: 'SCRIPT_READY',
        },
      });

      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: 'EDITING',
          active_version_id: version.id,
          headline: llmResult.suggestedHeadline || post.headline,
          caption: Array.isArray(llmResult.captions) ? llmResult.captions.join('\n') : String(llmResult.captions || ''),
          category: llmResult.suggestedCategory || post.category,
          tags: llmResult.suggestedTags,
        },
      });

      // Auto-publish breaking news if enabled
      if (post.is_breaking && settings?.auto_publish_breaking) {
        await this.prisma.post.update({
          where: { id: postId },
          data: {
            status: 'LIVE',
            published_at_live: new Date(),
          },
        });
        console.log(`[Breaking] Auto-published post: ${llmResult.suggestedHeadline || post.headline}`);
      }

      console.log(`[Generation] Script ready for post ${postId}`);
    } catch (err) {
      console.error(`[Generation] Error generating script for post ${postId}:`, err);
      throw err;
    }
  }

  async generateVideoFromScript(postId: string, versionId: string): Promise<void> {
    const version = await this.prisma.generationVersion.findUnique({
      where: { id: versionId },
      include: { post: { include: { story: true } } },
    });

    if (!version) throw new Error(`Version ${versionId} not found`);
    if (version.post_id !== postId) throw new Error(`Version ${versionId} does not belong to post ${postId}`);

    const settings = await this.prisma.settings.findFirst();
    const video = this.getVideoProvider(settings);

    try {
      await this.prisma.generationVersion.update({
        where: { id: versionId },
        data: { status: 'VIDEO_GENERATING' },
      });

      console.log(`[Generation] Generating video from script for version ${versionId}`);
      const rawImageUrl = await this.getSourceImageWithFallback(version.post.story);
      const sourceImageUrl = rawImageUrl ? await this.proxyImageForRunway(rawImageUrl, postId) : undefined;
      const sanitizedPrompt = this.sanitizeVideoPrompt(version.video_prompt);

      const videoResult = await video.generateVideo({
        videoPrompt: sanitizedPrompt,
        script: version.script_text,
        durationSeconds: 15,
        aspectRatio: '9:16',
        headline: version.post.headline || version.post.story.title,
        sourceImageUrl,
      });

      // Add TTS audio
      const path = require('path');
      const os = require('os');
      const fs = require('fs');
      const audioPath = path.join(os.tmpdir(), `${versionId}_audio.mp3`);
      const videoWithAudioPath = path.join(os.tmpdir(), `${versionId}_final.mp4`);

      const hasAudio = await this.generateTTSAudio(version.script_text, audioPath, undefined, undefined, version.post.category);
      let finalVideoPath = videoResult.mp4FilePath;

      if (hasAudio) {
        const merged = await this.mergeAudioWithVideo(
          videoResult.mp4FilePath,
          audioPath,
          videoWithAudioPath
        );
        if (merged) finalVideoPath = videoWithAudioPath;
        try { fs.unlinkSync(audioPath); } catch {}
      }

      // Upload to storage
      const key = `videos/${postId}/${versionId}`;
      const mp4Key = `${key}/video.mp4`;
      const thumbKey = `${key}/thumb.jpg`;
      const rawMp4Key = `${key}/video_raw.mp4`;

      const rawMp4Url = await this.s3.uploadFile(videoResult.mp4FilePath, rawMp4Key, 'video/mp4');
      const mp4Url = await this.s3.uploadFile(finalVideoPath, mp4Key, 'video/mp4');
      const thumbUrl = await this.s3.uploadFile(videoResult.thumbnailFilePath, thumbKey, 'image/jpeg');

      if (finalVideoPath !== videoResult.mp4FilePath) {
        try { fs.unlinkSync(finalVideoPath); } catch {}
      }

      // Generate thumbnail candidates
      const thumbnailPaths = await this.generateThumbnails(finalVideoPath, videoResult.durationSeconds);
      const thumbCandidates: string[] = [];
      
      for (let i = 0; i < thumbnailPaths.length; i++) {
        const candidateKey = `${key}/thumb_${i}.jpg`;
        const candidateUrl = await this.s3.uploadFile(thumbnailPaths[i], candidateKey, 'image/jpeg');
        thumbCandidates.push(candidateUrl);
        try { fs.unlinkSync(thumbnailPaths[i]); } catch {}
      }

      const asset = await this.prisma.videoAsset.create({
        data: {
          mp4_url: mp4Url,
          thumb_url: thumbCandidates[0] || thumbUrl,
          duration_seconds: videoResult.durationSeconds,
          thumb_candidates: thumbCandidates,
        },
      });

      await this.prisma.generationVersion.update({
        where: { id: versionId },
        data: {
          video_asset_id: asset.id,
          video_raw_url: rawMp4Url,
          status: 'COMPLETED',
        },
      });

      // Update post status to EDITING
      await this.prisma.post.update({
        where: { id: version.post_id },
        data: { status: 'EDITING', active_version_id: versionId },
      });

      console.log(`[Generation] Video generation complete for version ${versionId}`);
    } catch (err) {
      console.error(`[Generation] Error generating video for version ${versionId}:`, err);
      await this.prisma.generationVersion.update({
        where: { id: versionId },
        data: { status: 'FAILED', error: err.message },
      });
      throw err;
    }
  }

  async regenerateAudio(postId: string, versionId: string): Promise<void> {
    const version = await this.prisma.generationVersion.findUnique({
      where: { id: versionId },
      include: { videoAsset: true, post: true },
    });

    if (!version) throw new Error(`Version ${versionId} not found`);
    if (version.post_id !== postId) throw new Error(`Version ${versionId} does not belong to post ${postId}`);
    if (!version.video_raw_url) throw new Error('No raw video URL found. This version was generated before audio regeneration was supported.');

    try {
      console.log(`[Generation] Regenerating audio for version ${versionId}`);
      
      const path = require('path');
      const os = require('os');
      const fs = require('fs');
      const https = require('https');
      const http = require('http');
      
      // Download raw video
      const rawVideoPath = path.join(os.tmpdir(), `${versionId}_raw.mp4`);
      const audioPath = path.join(os.tmpdir(), `${versionId}_new_audio.mp3`);
      const finalVideoPath = path.join(os.tmpdir(), `${versionId}_new_final.mp4`);

      // Download raw video file
      await new Promise((resolve, reject) => {
        const protocol = version.video_raw_url.startsWith('https://') ? https : http;
        const file = fs.createWriteStream(rawVideoPath);
        protocol.get(version.video_raw_url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(null);
          });
        }).on('error', (err) => {
          fs.unlinkSync(rawVideoPath);
          reject(err);
        });
      });

      // Generate new TTS audio
      const hasAudio = await this.generateTTSAudio(version.script_text, audioPath, undefined, undefined, version.post.category);
      if (!hasAudio) throw new Error('Failed to generate TTS audio');

      // Merge with raw video
      const merged = await this.mergeAudioWithVideo(rawVideoPath, audioPath, finalVideoPath);
      if (!merged) throw new Error('Failed to merge audio with video');

      // Upload new final video
      const key = `videos/${postId}/${versionId}/video.mp4`;
      const mp4Url = await this.s3.uploadFile(finalVideoPath, key, 'video/mp4');

      // Update video asset
      await this.prisma.videoAsset.update({
        where: { id: version.video_asset_id },
        data: { mp4_url: mp4Url },
      });

      // Clean up temp files
      try { 
        fs.unlinkSync(rawVideoPath);
        fs.unlinkSync(audioPath);
        fs.unlinkSync(finalVideoPath);
      } catch {}

      console.log(`[Generation] Audio regenerated for version ${versionId}`);
    } catch (err) {
      console.error(`[Generation] Error regenerating audio for version ${versionId}:`, err);
      throw err;
    }
  }

  private async generateThumbnails(videoPath: string, durationSeconds: number): Promise<string[]> {
    const ffmpeg = require('fluent-ffmpeg');
    const fs = require('fs');
    const path = require('path');
    const thumbnails: string[] = [];
    
    const timestamps = [
      0,                                    // 0% (first frame)
      Math.max(1, durationSeconds * 0.25),  // 25%
      Math.max(2, durationSeconds * 0.50),  // 50%
      Math.max(3, durationSeconds * 0.75),  // 75%
    ];

    for (let i = 0; i < timestamps.length; i++) {
      const thumbPath = path.join('/tmp', `thumb_${i}_${Date.now()}.jpg`);
      
      try {
        await new Promise((resolve, reject) => {
          ffmpeg(videoPath)
            .screenshots({
              timestamps: [timestamps[i]],
              filename: path.basename(thumbPath),
              folder: path.dirname(thumbPath),
              size: '360x640',
            })
            .on('end', resolve)
            .on('error', reject);
        });
        
        thumbnails.push(thumbPath);
      } catch (err) {
        console.error("[Generation] Thumbnail generation error:", err);
      }
    }

    return thumbnails;
  }


  private estimateCredits(provider: string, durationSeconds: number): number {
    // Rough credit estimation based on provider and duration
    const baseCredits: Record<string, number> = {
      'runway': 10,
      'luma': 8,
      'kling': 7,
      'minimax': 6,
      'fal': 5,
      'stub': 0,
    };
    
    const base = baseCredits[provider] || 5;
    const durationMultiplier = Math.max(1, durationSeconds / 5); // 5 seconds = 1x
    
    return Math.round(base * durationMultiplier * 100) / 100;
  }


  private async postProcessVideo(
    inputPath: string,
    outputPath: string,
    options: {
      category: string;
      characters: { name: string; role: string }[];
      addIntro: boolean;
      addOutro: boolean;
    }
  ): Promise<boolean> {
    const { execSync } = require('child_process');
    const scriptPath = '/app/scripts/video-postprocess.py';
    
    try {
      const optionsJson = JSON.stringify(options);
      console.log(`[Generation] Post-processing video: category=$\{options.category}, characters=$\{options.characters.length}`);
      
      execSync(
        `python3 "$\{scriptPath}" "$\{inputPath}" "$\{outputPath}" '$\{optionsJson}'`,
        { stdio: 'pipe', timeout: 180000 } // 3 minutes timeout
      );
      
      console.log('[Generation] Post-processing completed successfully');
      return true;
    } catch (err) {
      console.error('[Generation] Post-processing failed:', err);
      return false;
    }
  }

}