import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Project, 
  Clip, 
  Track, 
  MediaAsset, 
  CaptionSegment, 
  AIEditPlan, 
  HistoryCheckpoint,
  RenderJob,
  TransformSettings,
  ColorSettings,
  EffectSettings,
  TransitionType,
  BrandKit
} from '../types/editor.ts';
import { getInitialSampleAssets } from '../services/sampleMedia.ts';
import { 
  createInitialProject, 
  saveProjectToStorage, 
  loadProjectFromStorage, 
  applyAIPlan 
} from '../services/projectManager.ts';
import { generateAIEditPlan } from '../services/aiEngine.ts';
import { renderEngine, RenderOptions } from '../services/renderEngine.ts';

interface ProjectContextType {
  project: Project;
  playhead: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedClip: Clip | null;
  selectedTrackId: string | null;
  zoom: number; // pixels per second
  snapping: boolean;
  rippleDelete: boolean;
  activeTab: 'media' | 'ai' | 'inspector' | 'text' | 'captions' | 'export' | 'brand';
  inspectorTab: 'transform' | 'color' | 'audio' | 'transitions' | 'effects' | 'speed';
  aiPlan: AIEditPlan | null;
  isGeneratingPlan: boolean;
  renderJob: RenderJob | null;
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  setPlayhead: (time: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setSnapping: (enabled: boolean) => void;
  setRippleDelete: (enabled: boolean) => void;
  setActiveTab: (tab: 'media' | 'ai' | 'inspector' | 'text' | 'captions' | 'export' | 'brand') => void;
  setInspectorTab: (tab: 'transform' | 'color' | 'audio' | 'transitions' | 'effects' | 'speed') => void;
  
  // Clip Manipulation
  splitClipAtPlayhead: () => void;
  deleteSelectedClip: () => void;
  duplicateSelectedClip: () => void;
  trimClip: (clipId: string, newStart: number, newEnd: number) => void;
  moveClip: (clipId: string, targetTrackId: string, newStart: number) => void;
  updateClipTransforms: (clipId: string, transforms: Partial<TransformSettings>) => void;
  updateClipColor: (clipId: string, color: Partial<ColorSettings>) => void;
  updateClipEffect: (clipId: string, effect: Partial<EffectSettings>) => void;
  updateClipTransition: (clipId: string, inOut: 'in' | 'out', transitionType: TransitionType, duration: number) => void;
  updateClipVolume: (clipId: string, volume: number) => void;
  updateClipSpeed: (clipId: string, speed: number) => void;
  
  // Track Actions
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  
  // AI Actions
  requestAIPlan: (userPrompt: string) => Promise<AIEditPlan>;
  applyAIPlanToTimeline: () => void;
  dismissAIPlan: () => void;
  removeSilences: () => void;
  
  // Captions
  addCaption: (caption: Omit<CaptionSegment, 'id'>) => void;
  updateCaption: (id: string, updates: Partial<CaptionSegment>) => void;
  deleteCaption: (id: string) => void;
  
  // Media & Upload
  uploadMediaFiles: (files: FileList | File[]) => Promise<void>;
  insertAssetToTimeline: (asset: MediaAsset, targetTrackId?: string, atTime?: number) => void;
  
  // History & Project
  undo: () => void;
  redo: () => void;
  createCheckpoint: (label: string) => void;
  createNewProject: (template: 'youtube' | 'shorts' | 'square') => Promise<void>;
  updateBrandKit: (updates: Partial<BrandKit>) => void;
  
  // Render & Export
  startRender: (options: RenderOptions) => Promise<RenderJob>;
  cancelRender: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project>(() => {
    const saved = loadProjectFromStorage();
    if (saved) return saved;
    // placeholder until sample media loads
    return {
      id: 'proj_init',
      name: 'Loading Project...',
      description: '',
      duration: 24,
      fps: 30,
      resolution: { width: 1920, height: 1080, name: '1080p Full HD', aspect: '16:9' },
      tracks: [],
      mediaAssets: [],
      captions: [],
      brandKit: {
        primaryColor: '#6366f1',
        secondaryColor: '#38bdf8',
        logoPosition: 'top-right',
        logoScale: 0.6,
        defaultFont: 'Plus Jakarta Sans',
        watermarkOpacity: 0.75,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
  });

  const [playhead, setPlayheadState] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_keynote_main');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('track_v1');
  const [zoom, setZoom] = useState<number>(45); // 45px per second
  const [snapping, setSnapping] = useState<boolean>(true);
  const [rippleDelete, setRippleDelete] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'media' | 'ai' | 'inspector' | 'text' | 'captions' | 'export' | 'brand'>('media');
  const [inspectorTab, setInspectorTab] = useState<'transform' | 'color' | 'audio' | 'transitions' | 'effects' | 'speed'>('transform');
  const [aiPlan, setAiPlan] = useState<AIEditPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<HistoryCheckpoint[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryCheckpoint[]>([]);

  // Load sample assets on mount if starting fresh
  useEffect(() => {
    async function init() {
      const saved = loadProjectFromStorage();
      if (!saved || saved.tracks.length === 0) {
        const samples = await getInitialSampleAssets();
        const initial = createInitialProject(samples);
        setProject(initial);
        saveProjectToStorage(initial);
      }
    }
    init();
  }, []);

  // Autosave
  useEffect(() => {
    if (project.id !== 'proj_init' && project.tracks.length > 0) {
      saveProjectToStorage(project);
    }
  }, [project]);

  // Playback timer loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTime) / 1000;
        setPlayheadState(prev => {
          const next = prev + delta;
          if (next >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      lastTime = now;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, project.duration]);

  const setPlayhead = (time: number) => {
    const clamped = Math.max(0, Math.min(project.duration, time));
    setPlayheadState(clamped);
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const createCheckpoint = (label: string) => {
    const checkpoint: HistoryCheckpoint = {
      id: `cp_${Date.now()}`,
      timestamp: Date.now(),
      label,
      projectSnapshot: JSON.parse(JSON.stringify(project)),
    };
    setUndoStack(prev => [...prev.slice(-30), checkpoint]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, {
      id: `cp_redo_${Date.now()}`,
      timestamp: Date.now(),
      label: 'Redo state',
      projectSnapshot: JSON.parse(JSON.stringify(project)),
    }]);
    setProject(last.projectSnapshot);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, {
      id: `cp_undo_${Date.now()}`,
      timestamp: Date.now(),
      label: 'Undo state',
      projectSnapshot: JSON.parse(JSON.stringify(project)),
    }]);
    setProject(next.projectSnapshot);
  };

  // Find currently selected clip object
  let selectedClip: Clip | null = null;
  if (selectedClipId) {
    for (const tr of project.tracks) {
      const c = tr.clips.find(clip => clip.id === selectedClipId);
      if (c) {
        selectedClip = c;
        break;
      }
    }
  }

  // Clip manipulation
  const splitClipAtPlayhead = () => {
    if (!selectedClipId) return;
    createCheckpoint('Split Clip');
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const idx = tr.clips.findIndex(c => c.id === selectedClipId);
        if (idx !== -1) {
          const orig = tr.clips[idx];
          if (playhead > orig.timelineStart && playhead < orig.timelineEnd) {
            const offset = playhead - orig.timelineStart;
            const part1: Clip = {
              ...orig,
              id: `${orig.id}_pt1`,
              timelineEnd: playhead,
              sourceEnd: orig.sourceStart + offset * orig.speed,
            };
            const part2: Clip = {
              ...orig,
              id: `${orig.id}_pt2`,
              timelineStart: playhead,
              sourceStart: orig.sourceStart + offset * orig.speed,
            };
            tr.clips.splice(idx, 1, part1, part2);
            setSelectedClipId(part2.id);
          }
          break;
        }
      }
      return clone;
    });
  };

  const deleteSelectedClip = () => {
    if (!selectedClipId) return;
    createCheckpoint('Delete Clip');
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const idx = tr.clips.findIndex(c => c.id === selectedClipId);
        if (idx !== -1) {
          const removed = tr.clips.splice(idx, 1)[0];
          if (rippleDelete && tr.type === 'video') {
            const gap = removed.timelineEnd - removed.timelineStart;
            tr.clips.forEach(c => {
              if (c.timelineStart >= removed.timelineEnd) {
                c.timelineStart -= gap;
                c.timelineEnd -= gap;
              }
            });
          }
          break;
        }
      }
      return clone;
    });
    setSelectedClipId(null);
  };

  const duplicateSelectedClip = () => {
    if (!selectedClipId) return;
    createCheckpoint('Duplicate Clip');
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const idx = tr.clips.findIndex(c => c.id === selectedClipId);
        if (idx !== -1) {
          const orig = tr.clips[idx];
          const dur = orig.timelineEnd - orig.timelineStart;
          const dup: Clip = {
            ...orig,
            id: `${orig.id}_dup_${Date.now()}`,
            name: `${orig.name} (Copy)`,
            timelineStart: orig.timelineEnd + 0.2,
            timelineEnd: orig.timelineEnd + 0.2 + dur,
          };
          tr.clips.push(dup);
          tr.clips.sort((a, b) => a.timelineStart - b.timelineStart);
          setSelectedClipId(dup.id);
          break;
        }
      }
      return clone;
    });
  };

  const trimClip = (clipId: string, newStart: number, newEnd: number) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          c.timelineStart = Math.max(0, newStart);
          c.timelineEnd = Math.max(c.timelineStart + 0.1, newEnd);
          break;
        }
      }
      return clone;
    });
  };

  const moveClip = (clipId: string, targetTrackId: string, newStart: number) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      let found: Clip | null = null;
      for (const tr of clone.tracks) {
        const idx = tr.clips.findIndex(c => c.id === clipId);
        if (idx !== -1) {
          found = tr.clips.splice(idx, 1)[0];
          break;
        }
      }
      if (found) {
        const dur = found.timelineEnd - found.timelineStart;
        found.trackId = targetTrackId;
        found.timelineStart = Math.max(0, newStart);
        found.timelineEnd = found.timelineStart + dur;
        const target = clone.tracks.find(t => t.id === targetTrackId);
        if (target) {
          target.clips.push(found);
          target.clips.sort((a, b) => a.timelineStart - b.timelineStart);
        }
      }
      return clone;
    });
  };

  const updateClipTransforms = (clipId: string, transforms: Partial<TransformSettings>) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          c.transforms = { ...c.transforms, ...transforms };
          break;
        }
      }
      return clone;
    });
  };

  const updateClipColor = (clipId: string, color: Partial<ColorSettings>) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          c.colorAdjustments = { ...c.colorAdjustments, ...color };
          break;
        }
      }
      return clone;
    });
  };

  const updateClipEffect = (clipId: string, effect: Partial<EffectSettings>) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          c.effect = { ...c.effect, ...effect };
          break;
        }
      }
      return clone;
    });
  };

  const updateClipTransition = (
    clipId: string,
    inOut: 'in' | 'out',
    transitionType: TransitionType,
    duration: number
  ) => {
    createCheckpoint('Change Transition');
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          if (inOut === 'in') {
            c.transitionIn = { type: transitionType, duration };
          } else {
            c.transitionOut = { type: transitionType, duration };
          }
          break;
        }
      }
      return clone;
    });
  };

  const updateClipVolume = (clipId: string, volume: number) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          c.volume = volume;
          break;
        }
      }
      return clone;
    });
  };

  const updateClipSpeed = (clipId: string, speed: number) => {
    createCheckpoint('Change Speed');
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      for (const tr of clone.tracks) {
        const c = tr.clips.find(clip => clip.id === clipId);
        if (c) {
          const currentDur = c.timelineEnd - c.timelineStart;
          const newDur = currentDur / speed;
          c.speed = speed;
          c.timelineEnd = c.timelineStart + newDur;
          break;
        }
      }
      return clone;
    });
  };

  // Track actions
  const toggleTrackMute = (trackId: string) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      const tr = clone.tracks.find(t => t.id === trackId);
      if (tr) tr.muted = !tr.muted;
      return clone;
    });
  };

  const toggleTrackSolo = (trackId: string) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      const tr = clone.tracks.find(t => t.id === trackId);
      if (tr) tr.solo = !tr.solo;
      return clone;
    });
  };

  const toggleTrackLock = (trackId: string) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      const tr = clone.tracks.find(t => t.id === trackId);
      if (tr) tr.locked = !tr.locked;
      return clone;
    });
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      const tr = clone.tracks.find(t => t.id === trackId);
      if (tr) tr.volume = volume;
      return clone;
    });
  };

  // AI Actions
  const requestAIPlan = async (userPrompt: string): Promise<AIEditPlan> => {
    setIsGeneratingPlan(true);
    try {
      const plan = await generateAIEditPlan(userPrompt, project);
      setAiPlan(plan);
      return plan;
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const applyAIPlanToTimeline = () => {
    if (!aiPlan) return;
    createCheckpoint(`AI Edit: ${aiPlan.intentSummary}`);
    const { updatedProject } = applyAIPlan(project, aiPlan);
    setProject(updatedProject);
    setAiPlan(prev => prev ? { ...prev, applied: true } : null);
  };

  const dismissAIPlan = () => {
    setAiPlan(null);
  };

  const removeSilences = () => {
    createCheckpoint('Remove Silences');
    const { updatedProject } = applyAIPlan(project, {
      id: `plan_silence_${Date.now()}`,
      userPrompt: 'Remove Silences',
      intentSummary: 'Cut Long Silence Pauses',
      rationale: 'Trimming 1.8s silence pause and realigning timeline.',
      operations: [{ type: 'remove_silence', silenceThresholdSeconds: 1.0 }],
      validationReport: { isValid: true, errors: [], warnings: [], repairedOperationsCount: 0 },
      applied: true,
      createdAt: Date.now(),
    });
    setProject(updatedProject);
  };

  // Captions
  const addCaption = (caption: Omit<CaptionSegment, 'id'>) => {
    createCheckpoint('Add Caption');
    const newCap: CaptionSegment = {
      ...caption,
      id: `cap_${Date.now()}`,
    };
    setProject(prev => ({
      ...prev,
      captions: [...prev.captions, newCap].sort((a, b) => a.start - b.start),
    }));
  };

  const updateCaption = (id: string, updates: Partial<CaptionSegment>) => {
    setProject(prev => ({
      ...prev,
      captions: prev.captions.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteCaption = (id: string) => {
    createCheckpoint('Delete Caption');
    setProject(prev => ({
      ...prev,
      captions: prev.captions.filter(c => c.id !== id),
    }));
  };

  // Media & File Upload
  const uploadMediaFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newAssets: MediaAsset[] = [];

    for (const file of fileArray) {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      let duration = 5;
      let width = 1920;
      let height = 1080;
      let thumbnail = '';

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = url;
        await new Promise((res) => {
          vid.onloadedmetadata = () => {
            duration = vid.duration || 10;
            width = vid.videoWidth || 1920;
            height = vid.videoHeight || 1080;
            res(true);
          };
          vid.onerror = () => res(false);
        });
        thumbnail = project.brandKit.logoUrl || '';
      } else if (isImage) {
        thumbnail = url;
        duration = 5;
      }

      const asset: MediaAsset = {
        id: `user_asset_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        url,
        duration: Math.round(duration * 10) / 10,
        width,
        height,
        fps: 30,
        thumbnail: thumbnail || project.brandKit.logoUrl || '',
        size: file.size,
        tags: [isVideo ? 'user-video' : isAudio ? 'user-audio' : 'user-image'],
      };
      newAssets.push(asset);
    }

    setProject(prev => ({
      ...prev,
      mediaAssets: [...prev.mediaAssets, ...newAssets],
    }));
  };

  const insertAssetToTimeline = (asset: MediaAsset, targetTrackId?: string, atTime?: number) => {
    createCheckpoint(`Insert ${asset.name}`);
    const time = atTime !== undefined ? atTime : playhead;
    const trId = targetTrackId || (asset.type === 'video' ? 'track_v1' : asset.type === 'audio' ? 'track_a2' : 'track_t1');
    const dur = asset.duration > 0 ? asset.duration : 5;

    const newClip: Clip = {
      id: `clip_${Date.now()}`,
      trackId: trId,
      assetId: asset.id,
      name: asset.name,
      type: asset.type === 'video' ? 'video' : asset.type === 'audio' ? 'audio' : 'image',
      timelineStart: time,
      timelineEnd: time + dur,
      sourceStart: 0,
      sourceEnd: dur,
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
        contrast: 0,
        highlights: 0,
        shadows: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        vignette: 0,
      },
      effect: { type: 'none', intensity: 0, enabled: false },
      transitionIn: { type: 'crossfade', duration: 0.4 },
    };

    setProject(prev => {
      const clone: Project = JSON.parse(JSON.stringify(prev));
      const tr = clone.tracks.find(t => t.id === trId);
      if (tr) {
        tr.clips.push(newClip);
        tr.clips.sort((a, b) => a.timelineStart - b.timelineStart);
      }
      return clone;
    });

    setSelectedClipId(newClip.id);
  };

  const createNewProject = async (template: 'youtube' | 'shorts' | 'square') => {
    const samples = await getInitialSampleAssets();
    const initial = createInitialProject(samples);

    if (template === 'shorts') {
      initial.name = 'Vertical Short / Reel Project';
      initial.resolution = {
        width: 1080,
        height: 1920,
        name: '1080x1920 Vertical (9:16)',
        aspect: '9:16',
      };
      initial.tracks.forEach(tr => {
        if (tr.type === 'video') {
          tr.clips.forEach(c => (c.transforms.scale = 1.78));
        }
      });
    } else if (template === 'square') {
      initial.name = 'Square Feed Video';
      initial.resolution = {
        width: 1080,
        height: 1080,
        name: '1080x1080 Square (1:1)',
        aspect: '1:1',
      };
    }

    setUndoStack([]);
    setRedoStack([]);
    setProject(initial);
    saveProjectToStorage(initial);
    setSelectedClipId(null);
    setPlayhead(0);
  };

  const updateBrandKit = (updates: Partial<BrandKit>) => {
    setProject(prev => ({
      ...prev,
      brandKit: { ...prev.brandKit, ...updates },
    }));
  };

  // Render & Export
  const startRender = async (options: RenderOptions): Promise<RenderJob> => {
    setIsPlaying(false);
    return await renderEngine.renderProject(project, options, (job) => {
      setRenderJob({ ...job });
    });
  };

  const cancelRender = () => {
    renderEngine.cancelRender();
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        playhead,
        isPlaying,
        selectedClipId,
        selectedClip,
        selectedTrackId,
        zoom,
        snapping,
        rippleDelete,
        activeTab,
        inspectorTab,
        aiPlan,
        isGeneratingPlan,
        renderJob,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,

        setPlayhead,
        togglePlay,
        setIsPlaying,
        selectClip: (id) => setSelectedClipId(id),
        selectTrack: (id) => setSelectedTrackId(id),
        setZoom,
        setSnapping,
        setRippleDelete,
        setActiveTab,
        setInspectorTab,

        splitClipAtPlayhead,
        deleteSelectedClip,
        duplicateSelectedClip,
        trimClip,
        moveClip,
        updateClipTransforms,
        updateClipColor,
        updateClipEffect,
        updateClipTransition,
        updateClipVolume,
        updateClipSpeed,

        toggleTrackMute,
        toggleTrackSolo,
        toggleTrackLock,
        setTrackVolume,

        requestAIPlan,
        applyAIPlanToTimeline,
        dismissAIPlan,
        removeSilences,

        addCaption,
        updateCaption,
        deleteCaption,

        uploadMediaFiles,
        insertAssetToTimeline,

        undo,
        redo,
        createCheckpoint,
        createNewProject,
        updateBrandKit,

        startRender,
        cancelRender,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
