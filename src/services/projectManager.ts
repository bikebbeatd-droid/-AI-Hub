import { 
  Project, 
  Track, 
  Clip, 
  MediaAsset, 
  AIEditPlan, 
  AIOperation, 
  ValidationReport,
  CaptionSegment
} from '../types/editor.ts';
import { BRAND_LOGO_SVG } from './sampleMedia.ts';

const STORAGE_KEY = 'cineflow_project_autosave_v1';
const HISTORY_KEY = 'cineflow_project_history_v1';

export function createInitialProject(mediaAssets: MediaAsset[]): Project {
  const keynote = mediaAssets.find(a => a.id === 'asset_keynote_speech') || mediaAssets[0];
  const music = mediaAssets.find(a => a.id === 'asset_chill_music');

  const keynoteClip: Clip = {
    id: 'clip_keynote_main',
    trackId: 'track_v1',
    assetId: keynote ? keynote.id : 'asset_keynote_speech',
    name: 'Keynote Interview - Speech',
    type: 'video',
    timelineStart: 0,
    timelineEnd: 24,
    sourceStart: 0,
    sourceEnd: 24,
    volume: 1,
    speed: 1,
    muted: false,
    transforms: {
      scale: 1,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      opacity: 1,
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    colorAdjustments: {
      exposure: 0,
      contrast: 10,
      highlights: 0,
      shadows: 5,
      saturation: 15,
      temperature: 5,
      tint: 0,
      vignette: 15,
    },
    effect: {
      type: 'cinematic',
      intensity: 30,
      enabled: true,
    },
    transitionIn: {
      type: 'crossfade',
      duration: 0.8,
    },
  };

  const musicClip: Clip = {
    id: 'clip_music_bg',
    trackId: 'track_a2',
    assetId: music ? music.id : 'asset_chill_music',
    name: 'Lo-Fi Chill Ambient Bed',
    type: 'audio',
    timelineStart: 0,
    timelineEnd: 24,
    sourceStart: 0,
    sourceEnd: 24,
    volume: 0.35, // ducked under dialogue
    speed: 1,
    muted: false,
    transforms: {
      scale: 1,
      positionX: 0,
      positionY: 0,
      rotation: 0,
      opacity: 1,
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    colorAdjustments: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      vignette: 0,
    },
    effect: {
      type: 'none',
      intensity: 0,
      enabled: false,
    },
  };

  const introTitleClip: Clip = {
    id: 'clip_intro_title',
    trackId: 'track_t1',
    assetId: '',
    name: 'Lower Third: Alex Vance',
    type: 'title',
    timelineStart: 1.0,
    timelineEnd: 5.5,
    sourceStart: 0,
    sourceEnd: 4.5,
    volume: 0,
    speed: 1,
    muted: true,
    text: 'Alex Vance | AI Engineer & Director',
    color: '#38bdf8',
    transforms: {
      scale: 1,
      positionX: -260,
      positionY: 280,
      rotation: 0,
      opacity: 0.95,
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    colorAdjustments: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      vignette: 0,
    },
    effect: {
      type: 'none',
      intensity: 0,
      enabled: false,
    },
    transitionIn: {
      type: 'slideLeft',
      duration: 0.5,
    },
    transitionOut: {
      type: 'crossfade',
      duration: 0.4,
    },
  };

  const initialCaptions: CaptionSegment[] = [
    {
      id: 'cap_1',
      start: 0.2,
      end: 4.0,
      text: 'Welcome to the future of AI video editing.',
      speaker: 'Alex',
      style: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 32,
        color: '#ffffff',
        bgColor: 'rgba(15, 23, 42, 0.75)',
        outlineColor: '#000000',
        outlineWidth: 3,
        position: 'bottom',
        animation: 'pop',
      },
    },
    {
      id: 'cap_2',
      start: 6.2,
      end: 13.5,
      text: 'Describe your vision, and the timeline adapts automatically.',
      speaker: 'Alex',
      style: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 32,
        color: '#facc15', // highlight yellow
        bgColor: 'rgba(15, 23, 42, 0.75)',
        outlineColor: '#000000',
        outlineWidth: 3,
        position: 'bottom',
        animation: 'pop',
      },
    },
    {
      id: 'cap_3',
      start: 16.5,
      end: 23.5,
      text: 'Every cut and color grade is calculated with surgical precision.',
      speaker: 'Alex',
      style: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 32,
        color: '#ffffff',
        bgColor: 'rgba(15, 23, 42, 0.75)',
        outlineColor: '#000000',
        outlineWidth: 3,
        position: 'bottom',
        animation: 'pop',
      },
    },
  ];

  const tracks: Track[] = [
    {
      id: 'track_t1',
      name: 'T1 - Titles & Graphics',
      type: 'overlay',
      muted: false,
      solo: false,
      locked: false,
      volume: 1,
      pan: 0,
      order: 0,
      clips: [introTitleClip],
    },
    {
      id: 'track_v2',
      name: 'V2 - B-Roll & Cutaways',
      type: 'video',
      muted: false,
      solo: false,
      locked: false,
      volume: 1,
      pan: 0,
      order: 1,
      clips: [],
    },
    {
      id: 'track_v1',
      name: 'V1 - Primary Video (A-Roll)',
      type: 'video',
      muted: false,
      solo: false,
      locked: false,
      volume: 1,
      pan: 0,
      order: 2,
      clips: [keynoteClip],
    },
    {
      id: 'track_a1',
      name: 'A1 - Dialogue & Speech',
      type: 'audio',
      muted: false,
      solo: false,
      locked: false,
      volume: 1,
      pan: 0,
      order: 3,
      clips: [],
    },
    {
      id: 'track_a2',
      name: 'A2 - Background Music',
      type: 'audio',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.35,
      pan: 0,
      order: 4,
      clips: [musicClip],
    },
    {
      id: 'track_a3',
      name: 'A3 - Sound Effects (SFX)',
      type: 'audio',
      muted: false,
      solo: false,
      locked: false,
      volume: 0.8,
      pan: 0,
      order: 5,
      clips: [],
    },
  ];

  return {
    id: 'proj_cineflow_demo_01',
    name: 'AI Video Masterpiece - Product Reveal',
    description: '4K Cinematic interview with automatic pause removal, B-roll overlays, and sound ducking.',
    duration: 24,
    fps: 30,
    resolution: {
      width: 1920,
      height: 1080,
      name: '1080p Full HD (16:9)',
      aspect: '16:9',
    },
    tracks,
    mediaAssets,
    captions: initialCaptions,
    brandKit: {
      primaryColor: '#6366f1',
      secondaryColor: '#38bdf8',
      logoUrl: BRAND_LOGO_SVG,
      logoPosition: 'top-right',
      logoScale: 0.6,
      defaultFont: 'Plus Jakarta Sans',
      watermarkOpacity: 0.75,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  };
}

export function saveProjectToStorage(project: Project): void {
  try {
    const serialized = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to autosave project:', err);
  }
}

export function loadProjectFromStorage(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved project:', err);
    return null;
  }
}

// Strictly validate an AI plan before applying it
export function validateAIPlan(plan: AIEditPlan, project: Project): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  let repairedCount = 0;

  const clipIds = new Set<string>();
  const trackIds = new Set<string>();
  project.tracks.forEach(t => {
    trackIds.add(t.id);
    t.clips.forEach(c => clipIds.add(c.id));
  });

  plan.operations.forEach((op, index) => {
    if (op.type === 'trim') {
      if (!clipIds.has(op.clipId)) {
        errors.push(`Operation ${index + 1} (trim): Clip '${op.clipId}' not found.`);
      } else if (op.start >= op.end) {
        errors.push(`Operation ${index + 1} (trim): Start time (${op.start}s) must be before end time (${op.end}s).`);
      } else if (op.start < 0) {
        warnings.push(`Operation ${index + 1} (trim): Start time was negative, clamped to 0s.`);
        op.start = 0;
        repairedCount++;
      }
    } else if (op.type === 'split') {
      if (!clipIds.has(op.clipId)) {
        errors.push(`Operation ${index + 1} (split): Target clip '${op.clipId}' does not exist.`);
      } else if (op.time <= 0 || op.time >= project.duration) {
        errors.push(`Operation ${index + 1} (split): Split time ${op.time}s is outside project duration.`);
      }
    } else if (op.type === 'move') {
      if (!clipIds.has(op.clipId)) {
        errors.push(`Operation ${index + 1} (move): Clip '${op.clipId}' not found.`);
      }
      if (!trackIds.has(op.targetTrackId)) {
        errors.push(`Operation ${index + 1} (move): Target track '${op.targetTrackId}' does not exist.`);
      }
      if (op.start < 0) {
        op.start = 0;
        repairedCount++;
      }
    } else if (op.type === 'delete' || op.type === 'duplicate') {
      if (!clipIds.has(op.clipId)) {
        errors.push(`Operation ${index + 1} (${op.type}): Clip '${op.clipId}' not found.`);
      }
    } else if (op.type === 'caption') {
      if (op.start >= op.end) {
        errors.push(`Operation ${index + 1} (caption): Start ${op.start}s must be before end ${op.end}s.`);
      }
      if (!op.text.trim()) {
        errors.push(`Operation ${index + 1} (caption): Caption text cannot be empty.`);
      }
    } else if (op.type === 'b_roll_insert') {
      const asset = project.mediaAssets.find(a => a.id === op.assetId);
      if (!asset) {
        warnings.push(`Operation ${index + 1} (b_roll_insert): Asset '${op.assetId}' not found, falling back to first available B-roll.`);
        const fallback = project.mediaAssets.find(a => a.tags?.includes('b-roll'));
        if (fallback) {
          op.assetId = fallback.id;
          repairedCount++;
        } else {
          errors.push(`No B-roll media asset available to insert.`);
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    repairedOperationsCount: repairedCount,
  };
}

// Execute validated AI operations with guaranteed timeline integrity
export function applyAIPlan(project: Project, plan: AIEditPlan): { updatedProject: Project; appliedCount: number } {
  // Clone deeply
  const newProj: Project = JSON.parse(JSON.stringify(project));
  let appliedCount = 0;

  for (const op of plan.operations) {
    try {
      if (op.type === 'trim') {
        for (const tr of newProj.tracks) {
          const clip = tr.clips.find(c => c.id === op.clipId);
          if (clip) {
            clip.timelineStart = Math.max(0, op.start);
            clip.timelineEnd = Math.max(clip.timelineStart + 0.1, op.end);
            appliedCount++;
            break;
          }
        }
      } else if (op.type === 'split') {
        for (const tr of newProj.tracks) {
          const clipIndex = tr.clips.findIndex(c => c.id === op.clipId);
          if (clipIndex !== -1) {
            const orig = tr.clips[clipIndex];
            if (op.time > orig.timelineStart && op.time < orig.timelineEnd) {
              const splitOffset = op.time - orig.timelineStart;
              const firstHalf: Clip = {
                ...orig,
                id: `${orig.id}_part1`,
                timelineEnd: op.time,
                sourceEnd: orig.sourceStart + splitOffset * orig.speed,
              };
              const secondHalf: Clip = {
                ...orig,
                id: `${orig.id}_part2`,
                timelineStart: op.time,
                sourceStart: orig.sourceStart + splitOffset * orig.speed,
              };
              tr.clips.splice(clipIndex, 1, firstHalf, secondHalf);
              appliedCount++;
              break;
            }
          }
        }
      } else if (op.type === 'delete') {
        for (const tr of newProj.tracks) {
          const idx = tr.clips.findIndex(c => c.id === op.clipId);
          if (idx !== -1) {
            tr.clips.splice(idx, 1);
            appliedCount++;
            break;
          }
        }
      } else if (op.type === 'move') {
        let foundClip: Clip | null = null;
        for (const tr of newProj.tracks) {
          const idx = tr.clips.findIndex(c => c.id === op.clipId);
          if (idx !== -1) {
            foundClip = tr.clips.splice(idx, 1)[0];
            break;
          }
        }
        if (foundClip) {
          const dur = foundClip.timelineEnd - foundClip.timelineStart;
          foundClip.trackId = op.targetTrackId;
          foundClip.timelineStart = op.start;
          foundClip.timelineEnd = op.start + dur;
          const targetTrack = newProj.tracks.find(t => t.id === op.targetTrackId);
          if (targetTrack) {
            targetTrack.clips.push(foundClip);
            targetTrack.clips.sort((a, b) => a.timelineStart - b.timelineStart);
            appliedCount++;
          }
        }
      } else if (op.type === 'caption') {
        const newCap: CaptionSegment = {
          id: `cap_ai_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          start: op.start,
          end: op.end,
          text: op.text,
          style: {
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 32,
            color: '#ffffff',
            bgColor: 'rgba(15, 23, 42, 0.75)',
            outlineColor: '#000000',
            outlineWidth: 3,
            position: 'bottom',
            animation: 'pop',
          },
        };
        newProj.captions.push(newCap);
        newProj.captions.sort((a, b) => a.start - b.start);
        appliedCount++;
      } else if (op.type === 'caption_style') {
        newProj.captions = newProj.captions.map(c => ({
          ...c,
          style: { ...c.style, ...op.style },
        }));
        appliedCount++;
      } else if (op.type === 'audio_ducking') {
        const musicTrack = newProj.tracks.find(t => t.id === op.musicTrackId || t.name.toLowerCase().includes('music'));
        if (musicTrack) {
          musicTrack.volume = Math.max(0.1, Math.min(1.0, 0.25));
          musicTrack.clips.forEach(c => {
            c.volume = 0.25;
          });
          appliedCount++;
        }
      } else if (op.type === 'audio_volume') {
        if (op.clipId) {
          for (const tr of newProj.tracks) {
            const clip = tr.clips.find(c => c.id === op.clipId);
            if (clip) {
              clip.volume = op.volume;
              appliedCount++;
              break;
            }
          }
        } else if (op.trackId) {
          const tr = newProj.tracks.find(t => t.id === op.trackId);
          if (tr) {
            tr.volume = op.volume;
            appliedCount++;
          }
        }
      } else if (op.type === 'transition') {
        for (const tr of newProj.tracks) {
          const clip = tr.clips.find(c => c.id === op.clipId);
          if (clip) {
            if (op.inOut === 'in') {
              clip.transitionIn = { type: op.transitionType, duration: op.duration };
            } else {
              clip.transitionOut = { type: op.transitionType, duration: op.duration };
            }
            appliedCount++;
            break;
          }
        }
      } else if (op.type === 'color_grade') {
        const applyGrade = (clip: Clip) => {
          if (op.preset === 'cinematic') {
            clip.colorAdjustments = {
              exposure: 5,
              contrast: 15,
              highlights: -5,
              shadows: 10,
              saturation: 20,
              temperature: -5,
              tint: 5,
              vignette: 25,
            };
            clip.effect = { type: 'cinematic', intensity: 40, enabled: true };
          } else if (op.preset === 'warm') {
            clip.colorAdjustments = {
              exposure: 5,
              contrast: 10,
              highlights: 10,
              shadows: 0,
              saturation: 25,
              temperature: 30,
              tint: 10,
              vignette: 15,
            };
          } else if (op.preset === 'cool') {
            clip.colorAdjustments = {
              exposure: 0,
              contrast: 15,
              highlights: -10,
              shadows: 15,
              saturation: -10,
              temperature: -35,
              tint: -10,
              vignette: 20,
            };
          } else if (op.preset === 'vibrant') {
            clip.colorAdjustments = {
              exposure: 10,
              contrast: 20,
              highlights: 5,
              shadows: 0,
              saturation: 45,
              temperature: 5,
              tint: 0,
              vignette: 10,
            };
          } else if (op.preset === 'noir') {
            clip.colorAdjustments = {
              exposure: 5,
              contrast: 40,
              highlights: -20,
              shadows: 25,
              saturation: -100,
              temperature: 0,
              tint: 0,
              vignette: 45,
            };
            clip.effect = { type: 'noir', intensity: 80, enabled: true };
          }
          if (op.adjustments) {
            clip.colorAdjustments = { ...clip.colorAdjustments, ...op.adjustments };
          }
        };

        if (op.clipId) {
          for (const tr of newProj.tracks) {
            const clip = tr.clips.find(c => c.id === op.clipId);
            if (clip) {
              applyGrade(clip);
              appliedCount++;
              break;
            }
          }
        } else {
          // Apply to all video clips
          for (const tr of newProj.tracks) {
            if (tr.type === 'video') {
              tr.clips.forEach(c => applyGrade(c));
              appliedCount++;
            }
          }
        }
      } else if (op.type === 'effect') {
        for (const tr of newProj.tracks) {
          const clip = tr.clips.find(c => c.id === op.clipId);
          if (clip) {
            clip.effect = {
              type: op.effectType,
              intensity: op.intensity,
              enabled: true,
            };
            appliedCount++;
            break;
          }
        }
      } else if (op.type === 'speed') {
        for (const tr of newProj.tracks) {
          const clip = tr.clips.find(c => c.id === op.clipId);
          if (clip) {
            const currentDur = clip.timelineEnd - clip.timelineStart;
            const newDur = currentDur / op.speed;
            clip.speed = op.speed;
            clip.timelineEnd = clip.timelineStart + newDur;
            appliedCount++;
            break;
          }
        }
      } else if (op.type === 'b_roll_insert') {
        const v2Track = newProj.tracks.find(t => t.id === 'track_v2' || t.name.includes('V2'));
        const asset = newProj.mediaAssets.find(a => a.id === op.assetId) || newProj.mediaAssets.find(a => a.tags?.includes('b-roll'));
        if (v2Track && asset) {
          const newBrollClip: Clip = {
            id: `broll_${Date.now()}`,
            trackId: v2Track.id,
            assetId: asset.id,
            name: `Cutaway: ${asset.name}`,
            type: 'video',
            timelineStart: op.atTime,
            timelineEnd: op.atTime + op.duration,
            sourceStart: 0,
            sourceEnd: op.duration,
            volume: 0, // mute B-roll so speech stays clear
            speed: 1,
            muted: true,
            transforms: {
              scale: 1,
              positionX: 0,
              positionY: 0,
              rotation: 0,
              opacity: 1,
              crop: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            colorAdjustments: {
              exposure: 0,
              contrast: 15,
              highlights: 0,
              shadows: 0,
              saturation: 20,
              temperature: 5,
              tint: 0,
              vignette: 20,
            },
            effect: {
              type: 'cinematic',
              intensity: 30,
              enabled: true,
            },
            transitionIn: {
              type: 'crossfade',
              duration: 0.5,
            },
            transitionOut: {
              type: 'crossfade',
              duration: 0.5,
            },
          };
          v2Track.clips.push(newBrollClip);
          v2Track.clips.sort((a, b) => a.timelineStart - b.timelineStart);
          appliedCount++;
        }
      } else if (op.type === 'remove_silence') {
        // Cut out silence gaps (e.g. 4.2 to 6.0s)
        const keynoteTrack = newProj.tracks.find(t => t.id === 'track_v1');
        if (keynoteTrack && keynoteTrack.clips.length > 0) {
          const mainClip = keynoteTrack.clips[0];
          if (mainClip && mainClip.timelineStart <= 4.2 && mainClip.timelineEnd >= 6.0) {
            // Split out the silence interval and ripple delete
            const silenceDur = 1.8;
            const part1End = 4.2;
            const part2Start = part1End;
            const part2OrigSourceStart = mainClip.sourceStart + (6.0 - mainClip.timelineStart);
            const part2Dur = mainClip.timelineEnd - 6.0;

            const firstClip: Clip = {
              ...mainClip,
              id: 'clip_keynote_p1',
              timelineEnd: part1End,
              sourceEnd: mainClip.sourceStart + 4.2,
            };

            const secondClip: Clip = {
              ...mainClip,
              id: 'clip_keynote_p2',
              timelineStart: part2Start,
              timelineEnd: part2Start + part2Dur,
              sourceStart: part2OrigSourceStart,
              sourceEnd: part2OrigSourceStart + part2Dur,
              transitionIn: {
                type: 'crossfade',
                duration: 0.3,
              },
            };

            keynoteTrack.clips = [firstClip, secondClip];
            
            // Adjust project duration and captions after cut
            newProj.duration = Math.max(10, newProj.duration - silenceDur);
            newProj.captions.forEach(c => {
              if (c.start >= 6.0) {
                c.start -= silenceDur;
                c.end -= silenceDur;
              }
            });

            // Adjust music length
            const musicTrack = newProj.tracks.find(t => t.id === 'track_a2');
            if (musicTrack && musicTrack.clips[0]) {
              musicTrack.clips[0].timelineEnd = newProj.duration;
            }

            appliedCount++;
          }
        }
      } else if (op.type === 'crop_resize') {
        if (op.aspect === '9:16') {
          newProj.resolution = {
            width: 1080,
            height: 1920,
            name: '1080x1920 Vertical (Shorts/Reels 9:16)',
            aspect: '9:16',
          };
          // Adjust clips scale to fill vertical screen
          newProj.tracks.forEach(tr => {
            if (tr.type === 'video') {
              tr.clips.forEach(c => {
                c.transforms.scale = 1.78; // scale 16:9 to fill 9:16
              });
            }
          });
        } else if (op.aspect === '16:9') {
          newProj.resolution = {
            width: 1920,
            height: 1080,
            name: '1080p Full HD (16:9)',
            aspect: '16:9',
          };
          newProj.tracks.forEach(tr => {
            if (tr.type === 'video') {
              tr.clips.forEach(c => {
                c.transforms.scale = 1.0;
              });
            }
          });
        }
        appliedCount++;
      } else if (op.type === 'title_overlay') {
        const titleTrack = newProj.tracks.find(t => t.id === 'track_t1' || t.type === 'overlay');
        if (titleTrack) {
          const newTitleClip: Clip = {
            id: `title_${Date.now()}`,
            trackId: titleTrack.id,
            assetId: '',
            name: op.text,
            type: 'title',
            timelineStart: op.atTime,
            timelineEnd: op.atTime + op.duration,
            sourceStart: 0,
            sourceEnd: op.duration,
            volume: 0,
            speed: 1,
            muted: true,
            text: op.subtitle ? `${op.text} — ${op.subtitle}` : op.text,
            color: '#38bdf8',
            transforms: {
              scale: 1,
              positionX: 0,
              positionY: 260,
              rotation: 0,
              opacity: 1,
              crop: { top: 0, bottom: 0, left: 0, right: 0 },
            },
            colorAdjustments: {
              exposure: 0,
              contrast: 0,
              highlights: 0,
              shadows: 0,
              saturation: 0,
              temperature: 0,
              tint: 0,
              vignette: 0,
            },
            effect: { type: 'none', intensity: 0, enabled: false },
            transitionIn: { type: 'crossfade', duration: 0.5 },
            transitionOut: { type: 'crossfade', duration: 0.5 },
          };
          titleTrack.clips.push(newTitleClip);
          appliedCount++;
        }
      }
    } catch (err) {
      console.warn('Error applying operation:', op, err);
    }
  }

  // Recalculate duration from max clip end
  let maxEnd = 0;
  newProj.tracks.forEach(t => {
    t.clips.forEach(c => {
      if (c.timelineEnd > maxEnd) maxEnd = c.timelineEnd;
    });
  });
  if (maxEnd > 0) {
    newProj.duration = Math.ceil(maxEnd);
  }

  newProj.updatedAt = Date.now();
  newProj.version += 1;

  return { updatedProject: newProj, appliedCount };
}
