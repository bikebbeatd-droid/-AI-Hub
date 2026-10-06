import { MediaAsset, TranscriptSegment } from '../types/editor.ts';

// Helper to generate a clean SVG data URL for thumbnails and logos
export function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

// Generate animated / static canvas video or audio blob
export async function generateSyntheticVideoAsset(
  title: string,
  duration: number,
  theme: 'keynote' | 'tech_broll' | 'city_broll',
  width = 1280,
  height = 720
): Promise<{ url: string; thumbnail: string; size: number }> {
  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Generate thumbnail at t=1s
  renderFrame(ctx, width, height, 1, theme, title);
  const thumbnail = canvas.toDataURL('image/jpeg', 0.85);

  // If MediaRecorder is supported, generate a short real video blob stream
  try {
    const stream = canvas.captureStream(24);
    
    // Add synthesized audio track
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    
    // Simple harmonic tone for video audio track
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const combinedTracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    const combinedStream = new MediaStream(combinedTracks);
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : '';

    if (mimeType && typeof MediaRecorder !== 'undefined') {
      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
      });

      recorder.start();

      // Render a few seconds of animation to produce a real, valid video container
      const recordSeconds = Math.min(duration, 4); // record 4s loopable
      const fps = 24;
      const totalFrames = recordSeconds * fps;
      let frame = 0;

      const interval = setInterval(() => {
        const time = frame / fps;
        renderFrame(ctx, width, height, time, theme, title);
        frame++;
        if (frame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
          osc.stop();
          audioCtx.close();
        }
      }, 1000 / fps);

      const blob = await recordPromise;
      const url = URL.createObjectURL(blob);
      return { url, thumbnail, size: blob.size };
    }
  } catch (err) {
    console.warn('Canvas video recording fallback:', err);
  }

  // Fallback: Return thumbnail as data URL if recording fails
  return {
    url: thumbnail,
    thumbnail,
    size: 245000,
  };
}

// Draw dynamic visual scenes for sample videos
function renderFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  theme: 'keynote' | 'tech_broll' | 'city_broll',
  title: string
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  if (theme === 'keynote') {
    // Studio Stage & Presenter
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic stage spotlight
    const spotX = w / 2 + Math.sin(time * 0.8) * 60;
    const spotGrad = ctx.createRadialGradient(spotX, h * 0.4, 20, spotX, h * 0.4, w * 0.6);
    spotGrad.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    spotGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    // Presenter Silhouette / Avatar
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(spotX, h * 0.42, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(spotX, h * 0.72, 130, 160, 0, 0, Math.PI * 2);
    ctx.fill();

    // Voice Waveform HUD
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = w * 0.2; x <= w * 0.8; x += 15) {
      const dist = Math.abs(x - w / 2);
      const amp = Math.sin(x * 0.05 + time * 6) * Math.cos(dist * 0.01) * 35;
      const y = h * 0.88 + amp;
      if (x === w * 0.2) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Keynote Badge & Timer HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(40, 40, 360, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LIVE INTERVIEW // KEYNOTE', 60, 72);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText(`TC: 00:00:${Math.floor(time).toString().padStart(2, '0')}:12  |  4K 60FPS`, 60, 92);
  } else if (theme === 'tech_broll') {
    // Tech Lab B-Roll
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing geometric grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    const gridOffset = (time * 30) % 60;
    for (let x = -60 + gridOffset; x < w + 60; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Motion node graphics
    for (let i = 0; i < 5; i++) {
      const nx = (w * 0.2 + i * 220 + Math.sin(time + i) * 30) % (w * 0.8);
      const ny = h * 0.45 + Math.cos(time * 1.5 + i) * 80;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(nx, ny, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(nx, ny, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Watermark tag
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('B-ROLL: CREATIVE WORKFLOW & LAB', 50, h - 50);
  } else {
    // Cityscape B-Roll Sunset
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#7c2d12');
    grad.addColorStop(0.5, '#c2410c');
    grad.addColorStop(1, '#18181b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing sun
    const sunGrad = ctx.createRadialGradient(w * 0.7, h * 0.4, 20, w * 0.7, h * 0.4, 250);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.3, '#f97316');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // City skyline silhouettes
    ctx.fillStyle = '#09090b';
    for (let bx = 0; bx < w; bx += 70) {
      const bh = 150 + ((bx * 9301 + 49297) % 2330) % 240;
      ctx.fillRect(bx, h - bh, 65, bh);
    }

    ctx.fillStyle = '#fed7aa';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('B-ROLL: CINEMATIC GOLDEN HOUR', 50, h - 50);
  }

  ctx.restore();
}

// Generate synthesized audio asset
export function generateSyntheticAudioAsset(
  title: string,
  duration: number,
  type: 'music' | 'sfx'
): { url: string; size: number } {
  try {
    const sampleRate = 44100;
    const numChannels = 2;
    const totalSamples = Math.floor(sampleRate * Math.min(duration, 10)); // 10s audio loop
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = audioCtx.createBuffer(numChannels, totalSamples, sampleRate);

    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);

    if (type === 'music') {
      // Lo-fi chord progression in C Minor (C, Eb, G, Bb)
      const chordFreqs = [130.81, 155.56, 196.0, 233.08];
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;
        // Chords
        chordFreqs.forEach((freq, idx) => {
          sample += Math.sin(2 * Math.PI * freq * t) * 0.08 * (1 + 0.1 * Math.sin(t * 2 + idx));
        });
        // Subtle beat pulse
        const beat = Math.sin(t * Math.PI * 2 * 1.5);
        if (beat > 0.8) sample += (Math.random() - 0.5) * 0.05;
        
        left[i] = sample;
        right[i] = sample * 0.95;
      }
    } else {
      // SFX: Fast swoosh / whoosh
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const progress = t / Math.min(duration, 1.5);
        const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, progress)));
        const noise = (Math.random() - 0.5) * 2;
        left[i] = noise * envelope * 0.3;
        right[i] = noise * envelope * 0.3;
      }
    }

    // Convert AudioBuffer to WAV blob
    const wavBlob = audioBufferToWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    audioCtx.close();
    return { url, size: wavBlob.size };
  } catch (err) {
    console.warn('Audio synthesis fallback:', err);
    return { url: '', size: 50000 };
  }
}

// Convert AudioBuffer to standard WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16);         // length = 16
  setUint16(1);          // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);                    // block align
  setUint16(16);                               // bits per sample

  // data chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

// Brand kit logo placeholder
export const BRAND_LOGO_SVG = createSvgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="#090d16"/>
  <rect x="8" y="8" width="184" height="184" rx="32" fill="none" stroke="url(#grad)" stroke-width="4"/>
  <circle cx="100" cy="100" r="48" fill="none" stroke="url(#grad)" stroke-width="12" stroke-dasharray="18 10"/>
  <polygon points="90,75 125,100 90,125" fill="#f8fafc"/>
</svg>
`);

// Initial default media library assets
export async function getInitialSampleAssets(): Promise<MediaAsset[]> {
  const keynoteMedia = await generateSyntheticVideoAsset(
    'Main Keynote: AI Video Revolution',
    24,
    'keynote'
  );

  const techMedia = await generateSyntheticVideoAsset(
    'B-Roll: Creative Tech Lab & Workflow',
    12,
    'tech_broll'
  );

  const cityMedia = await generateSyntheticVideoAsset(
    'B-Roll: Cinematic Golden Hour',
    10,
    'city_broll'
  );

  const musicMedia = generateSyntheticAudioAsset('Background Lo-Fi Chords', 30, 'music');
  const sfxMedia = generateSyntheticAudioAsset('Cinematic Whoosh Transition', 1.5, 'sfx');

  const keynoteTranscript: TranscriptSegment[] = [
    {
      id: 'seg_1',
      start: 0.0,
      end: 4.2,
      text: 'Welcome to the future of AI video editing where machines understand your vision.',
      speaker: 'Alex (Host)',
      words: [
        { word: 'Welcome', start: 0.0, end: 0.4, confidence: 0.98 },
        { word: 'to', start: 0.5, end: 0.7, confidence: 0.99 },
        { word: 'the', start: 0.8, end: 0.9, confidence: 0.99 },
        { word: 'future', start: 1.0, end: 1.4, confidence: 0.97 },
        { word: 'of', start: 1.5, end: 1.6, confidence: 0.99 },
        { word: 'AI', start: 1.7, end: 2.1, confidence: 0.99 },
        { word: 'video', start: 2.2, end: 2.6, confidence: 0.99 },
        { word: 'editing,', start: 2.7, end: 3.2, confidence: 0.98 },
        { word: 'where', start: 3.3, end: 3.5, confidence: 0.96 },
        { word: 'machines', start: 3.6, end: 4.0, confidence: 0.95 },
        { word: 'understand.', start: 4.0, end: 4.2, confidence: 0.96 },
      ],
    },
    {
      id: 'seg_silence_1',
      start: 4.2,
      end: 6.0,
      text: '[Long silence pause - 1.8s]',
      speaker: 'Alex (Host)',
      isFiller: true,
      words: [],
    },
    {
      id: 'seg_2',
      start: 6.0,
      end: 14.0,
      text: 'With CineFlow, you simply describe what you want and the timeline adapts automatically.',
      speaker: 'Alex (Host)',
      words: [
        { word: 'With', start: 6.0, end: 6.3, confidence: 0.99 },
        { word: 'CineFlow,', start: 6.4, end: 7.1, confidence: 0.97 },
        { word: 'you', start: 7.2, end: 7.4, confidence: 0.98 },
        { word: 'simply', start: 7.5, end: 8.0, confidence: 0.99 },
        { word: 'describe', start: 8.1, end: 8.7, confidence: 0.98 },
        { word: 'what', start: 8.8, end: 9.0, confidence: 0.99 },
        { word: 'you', start: 9.1, end: 9.3, confidence: 0.99 },
        { word: 'want,', start: 9.4, end: 9.8, confidence: 0.97 },
        { word: 'and', start: 10.0, end: 10.2, confidence: 0.98 },
        { word: 'the', start: 10.3, end: 10.5, confidence: 0.99 },
        { word: 'timeline', start: 10.6, end: 11.2, confidence: 0.99 },
        { word: 'adapts', start: 11.3, end: 11.9, confidence: 0.98 },
        { word: 'automatically.', start: 12.0, end: 13.8, confidence: 0.99 },
      ],
    },
    {
      id: 'seg_filler_1',
      start: 14.0,
      end: 16.5,
      text: 'Um... like, let us see how smart cuts can refine the rhythm.',
      speaker: 'Alex (Host)',
      isFiller: true,
      words: [
        { word: 'Um...', start: 14.0, end: 14.6, confidence: 0.92 },
        { word: 'like,', start: 14.7, end: 15.2, confidence: 0.91 },
        { word: 'let', start: 15.3, end: 15.5, confidence: 0.95 },
        { word: 'us', start: 15.6, end: 15.8, confidence: 0.97 },
        { word: 'see', start: 15.9, end: 16.5, confidence: 0.98 },
      ],
    },
    {
      id: 'seg_3',
      start: 16.5,
      end: 24.0,
      text: 'Every cut, transition, and color grade is calculated with surgical precision.',
      speaker: 'Alex (Host)',
      words: [
        { word: 'Every', start: 16.5, end: 16.9, confidence: 0.99 },
        { word: 'cut,', start: 17.0, end: 17.4, confidence: 0.98 },
        { word: 'transition,', start: 17.5, end: 18.2, confidence: 0.99 },
        { word: 'and', start: 18.3, end: 18.5, confidence: 0.99 },
        { word: 'color', start: 18.6, end: 19.0, confidence: 0.98 },
        { word: 'grade', start: 19.1, end: 19.5, confidence: 0.99 },
        { word: 'is', start: 19.6, end: 19.8, confidence: 0.98 },
        { word: 'calculated', start: 19.9, end: 20.6, confidence: 0.99 },
        { word: 'with', start: 20.7, end: 20.9, confidence: 0.99 },
        { word: 'surgical', start: 21.0, end: 21.6, confidence: 0.98 },
        { word: 'precision.', start: 21.7, end: 23.5, confidence: 0.99 },
      ],
    },
  ];

  return [
    {
      id: 'asset_keynote_speech',
      name: 'Main Keynote: AI Video Revolution (Host Interview)',
      type: 'video',
      url: keynoteMedia.url,
      duration: 24.0,
      width: 1920,
      height: 1080,
      fps: 30,
      thumbnail: keynoteMedia.thumbnail,
      size: keynoteMedia.size,
      transcript: keynoteTranscript,
      silenceRanges: [[4.2, 6.0]],
      tags: ['talking-head', 'keynote', 'speech', 'interview', 'ai-tech'],
      isSample: true,
    },
    {
      id: 'asset_tech_broll',
      name: 'B-Roll: Creative Tech Lab & Modern Workflow',
      type: 'video',
      url: techMedia.url,
      duration: 12.0,
      width: 1920,
      height: 1080,
      fps: 30,
      thumbnail: techMedia.thumbnail,
      size: techMedia.size,
      tags: ['b-roll', 'tech', 'software', 'creative', 'neon-cyan'],
      isSample: true,
    },
    {
      id: 'asset_city_broll',
      name: 'B-Roll: Cinematic Golden Hour Cityscape',
      type: 'video',
      url: cityMedia.url,
      duration: 10.0,
      width: 1920,
      height: 1080,
      fps: 30,
      thumbnail: cityMedia.thumbnail,
      size: cityMedia.size,
      tags: ['b-roll', 'cinematic', 'urban', 'architecture', 'sunset'],
      isSample: true,
    },
    {
      id: 'asset_chill_music',
      name: 'Background Music: Ambient Lo-Fi Beat',
      type: 'audio',
      url: musicMedia.url,
      duration: 30.0,
      width: 0,
      height: 0,
      fps: 0,
      thumbnail: createSvgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" fill="#0f172a" rx="16"/>
          <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" stroke-width="4"/>
          <path d="M42 35 v30 l24 -15 z" fill="#c084fc"/>
        </svg>
      `),
      size: musicMedia.size,
      tags: ['music', 'lo-fi', 'soundtrack', 'chill', 'ambient'],
      isSample: true,
    },
    {
      id: 'asset_sfx_whoosh',
      name: 'SFX: Cinematic Transition Whoosh',
      type: 'audio',
      url: sfxMedia.url,
      duration: 1.5,
      width: 0,
      height: 0,
      fps: 0,
      thumbnail: createSvgDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" fill="#0f172a" rx="16"/>
          <path d="M20 50 Q 50 20 80 50 T 90 50" fill="none" stroke="#38bdf8" stroke-width="5"/>
        </svg>
      `),
      size: sfxMedia.size,
      tags: ['sfx', 'transition', 'whoosh', 'impact'],
      isSample: true,
    },
    {
      id: 'asset_brand_logo',
      name: 'CineFlow Official Emblem Logo',
      type: 'image',
      url: BRAND_LOGO_SVG,
      duration: 0,
      width: 512,
      height: 512,
      fps: 0,
      thumbnail: BRAND_LOGO_SVG,
      size: 15400,
      tags: ['graphics', 'logo', 'watermark', 'branding'],
      isSample: true,
    },
  ];
}
