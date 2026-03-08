export interface VideoGenerationInput {
  videoPrompt: string;
  script: string;
  durationSeconds: number;
  aspectRatio: '9:16';
  headline: string;
  sourceImageUrl?: string;
}

export interface VideoGenerationResult {
  mp4FilePath: string;
  thumbnailFilePath: string;
  durationSeconds: number;
}

export interface VideoProvider {
  generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult>;
}
