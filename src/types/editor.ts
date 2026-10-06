export type TrackType = 'video' | 'audio' | 'overlay' | 'caption';
export type ClipType = 'video' | 'audio' | 'image' | 'title' | 'color';

export type TransitionType = 
  | 'none'
  | 'crossfade' 
  | 'dipToBlack' 
  | 'dipToWhite' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'zoomIn' 
  | 'wipe';

export type EffectType = 
  | 'none' 
  | 'cinematic' 
  | 'retro' 
  | 'glitch' 
  | 'glow' 
  | 'vignette' 
  | 'grain' 
  | 'sharpen' 
  | 'blur' 
  | 'noir';

export type ColorPreset = 
  | 'custom' 
  | 'cinematic' 
  | 'warm' 
  | 'cool' 
  | 'vibrant' 
  | 'noir' 
  | 'vintage';

export interface TransformSettings {
  scale: number;        // 0.1 to 3.0 (default 1)
  positionX: number;    // -500 to 500 (default 0)
  positionY: number;    // -500 to 500 (default 0)
  rotation: number;     // -180 to 180 (default 0)
  opacity: number;      // 0 to 1 (default 1)
  crop: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ColorSettings {
  exposure: number;     // -100 to 100
  contrast: number;     // -100 to 100
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  saturation: number;   // -100 to 100
  temperature: number;  // -100 to 100 (cool to warm)
  tint: number;         // -100 to 100 (green to magenta)
  vignette: number;     // 0 to 100
}

export interface EffectSettings {
  type: EffectType;
  intensity: number;    // 0 to 100
  enabled: boolean;
}

export interface Keyframe {
  time: number; // offset from clip start in seconds
  scale?: number;
  positionX?: number;
  positionY?: number;
  opacity?: number;
}

export interface Clip {
  id: string;
  trackId: string;
  assetId: string;
  name: string;
  type: ClipType;
  timelineStart: number; // in seconds
  timelineEnd: number;   // in seconds
  sourceStart: number;   // in seconds
  sourceEnd: number;     // in seconds
  volume: number;        // 0 to 2 (1 = 100%)
  speed: number;         // 0.25 to 4 (1 = normal)
  muted: boolean;
  text?: string;         // for title/overlay clips
  color?: string;        // for solid color or title color
  transforms: TransformSettings;
  colorAdjustments: ColorSettings;
  effect: EffectSettings;
  transitionIn?: {
    type: TransitionType;
    duration: number; // in seconds, e.g. 0.5
  };
  transitionOut?: {
    type: TransitionType;
    duration: number;
  };
  keyframes?: Keyframe[];
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  volume: number;  // 0 to 1.5
  pan: number;     // -1 to 1
  order: number;
  clips: Clip[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words?: WordTimestamp[];
  isFiller?: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  thumbnail: string;
  size: number; // bytes
  transcript?: TranscriptSegment[];
  silenceRanges?: [number, number][]; // [start, end] in seconds
  tags?: string[];
  isSample?: boolean;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;       // in pixels
  color: string;          // hex
  bgColor: string;        // hex or rgba
  outlineColor: string;   // hex
  outlineWidth: number;   // 0 to 8
  position: 'bottom' | 'center' | 'top';
  animation: 'none' | 'pop' | 'typewriter' | 'highlight';
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  style: CaptionStyle;
}

export interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  logoPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  logoScale: number;
  defaultFont: string;
  watermarkOpacity: number;
}

export interface ProjectResolution {
  width: number;
  height: number;
  name: string;
  aspect: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  duration: number; // total project duration in seconds
  fps: number;
  resolution: ProjectResolution;
  tracks: Track[];
  mediaAssets: MediaAsset[];
  captions: CaptionSegment[];
  brandKit: BrandKit;
  createdAt: number;
  updatedAt: number;
  version: number;
}

// AI Operations Schema
export type AIOperation =
  | { type: 'trim'; clipId: string; start: number; end: number; reason?: string }
  | { type: 'split'; clipId: string; time: number; reason?: string }
  | { type: 'move'; clipId: string; targetTrackId: string; start: number; reason?: string }
  | { type: 'delete'; clipId: string; reason?: string }
  | { type: 'duplicate'; clipId: string; reason?: string }
  | { type: 'caption'; start: number; end: number; text: string; reason?: string }
  | { type: 'caption_style'; style: Partial<CaptionStyle>; reason?: string }
  | { type: 'audio_ducking'; musicTrackId: string; speechTrackId: string; duckDb: number; reason?: string }
  | { type: 'audio_volume'; clipId?: string; trackId?: string; volume: number; reason?: string }
  | { type: 'audio_cleanup'; clipId: string; denoise: boolean; normalize: boolean; reason?: string }
  | { type: 'transition'; clipId: string; transitionType: TransitionType; duration: number; inOut: 'in' | 'out'; reason?: string }
  | { type: 'color_grade'; clipId?: string; preset: ColorPreset; adjustments?: Partial<ColorSettings>; reason?: string }
  | { type: 'effect'; clipId: string; effectType: EffectType; intensity: number; reason?: string }
  | { type: 'speed'; clipId: string; speed: number; reason?: string }
  | { type: 'crop_resize'; aspect: '16:9' | '9:16' | '1:1' | '4:5'; reason?: string }
  | { type: 'b_roll_insert'; assetId: string; atTime: number; duration: number; reason?: string }
  | { type: 'remove_silence'; silenceThresholdSeconds: number; reason?: string }
  | { type: 'title_overlay'; text: string; subtitle?: string; atTime: number; duration: number; reason?: string };

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  repairedOperationsCount: number;
}

export interface AIEditPlan {
  id: string;
  userPrompt: string;
  intentSummary: string;
  rationale: string;
  operations: AIOperation[];
  validationReport: ValidationReport;
  applied: boolean;
  createdAt: number;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'idle' | 'rendering' | 'verifying' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  currentFrame?: number;
  totalFrames?: number;
  fps: number;
  format: 'webm' | 'mp4';
  resolution: { width: number; height: number };
  startTime?: number;
  endTime?: number;
  verifiedDetails?: {
    fileSize: number;
    duration: number;
    width: number;
    height: number;
    fps: number;
    blobUrl: string;
    fileName: string;
  };
  error?: string;
}

export interface HistoryCheckpoint {
  id: string;
  timestamp: number;
  label: string;
  projectSnapshot: Project;
}
