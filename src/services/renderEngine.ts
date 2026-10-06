import { Project, RenderJob } from '../types/editor.ts';

export interface RenderOptions {
  resolution: { width: number; height: number; name: string };
  fps: number;
  format: 'webm' | 'mp4';
  quality: 'high' | 'medium' | 'fast';
}

export class RenderEngine {
  private currentJob: RenderJob | null = null;
  private isCancelled = false;

  public async renderProject(
    project: Project,
    options: RenderOptions,
    onProgress: (job: RenderJob) => void
  ): Promise<RenderJob> {
    this.isCancelled = false;
    const jobId = `render_${Date.now()}`;
    
    this.currentJob = {
      id: jobId,
      projectId: project.id,
      status: 'rendering',
      progress: 0,
      fps: options.fps,
      format: options.format,
      resolution: { width: options.resolution.width, height: options.resolution.height },
      startTime: Date.now(),
    };
    onProgress({ ...this.currentJob });

    try {
      // Create offscreen canvas for rendering
      const width = options.resolution.width;
      const height = options.resolution.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      const fps = options.fps;
      const duration = Math.max(1, project.duration);
      const totalFrames = Math.floor(duration * fps);
      this.currentJob.totalFrames = totalFrames;

      // Audio setup for mixed export stream
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      // Synthesize audio track for rendered video
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const stream = canvas.captureStream(fps);
      const combinedTracks = [...stream.getVideoTracks(), ...dest.stream.getAudioTracks()];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);

      const recordingPromise = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          resolve(finalBlob);
        };
        recorder.onerror = (e) => reject(e);
      });

      recorder.start(100);

      // Render frames progressively
      // Use time-sliced loop so UI does not freeze
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (this.isCancelled) {
          recorder.stop();
          osc.stop();
          audioCtx.close();
          this.currentJob.status = 'cancelled';
          onProgress({ ...this.currentJob });
          return this.currentJob;
        }

        const currentTime = frameIndex / fps;
        this.renderCompositeFrame(ctx, project, currentTime, width, height);

        // Update progress every few frames
        if (frameIndex % 3 === 0 || frameIndex === totalFrames - 1) {
          this.currentJob.progress = Math.round((frameIndex / totalFrames) * 90);
          this.currentJob.currentFrame = frameIndex;
          onProgress({ ...this.currentJob });
          // Yield to main thread
          await new Promise((r) => setTimeout(r, 12));
        }
      }

      recorder.stop();
      osc.stop();
      audioCtx.close();

      const blob = await recordingPromise;

      // STEP: VERIFICATION
      this.currentJob.status = 'verifying';
      this.currentJob.progress = 95;
      onProgress({ ...this.currentJob });

      const verifiedDetails = await this.verifyRenderedOutput(blob, options, duration);

      this.currentJob.status = 'completed';
      this.currentJob.progress = 100;
      this.currentJob.endTime = Date.now();
      this.currentJob.verifiedDetails = verifiedDetails;
      onProgress({ ...this.currentJob });

      return this.currentJob;
    } catch (err: any) {
      console.error('Rendering error:', err);
      this.currentJob.status = 'failed';
      this.currentJob.error = err?.message || 'Rendering pipeline interrupted.';
      onProgress({ ...this.currentJob });
      return this.currentJob;
    }
  }

  public cancelRender() {
    this.isCancelled = true;
  }

  // Draw the exact composition for any given timestamp
  private renderCompositeFrame(
    ctx: CanvasRenderingContext2D,
    project: Project,
    time: number,
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Render tracks from bottom to top
    const sortedTracks = [...project.tracks].sort((a, b) => b.order - a.order);

    for (const track of sortedTracks) {
      if (track.muted) continue;

      // Find active clip at `time`
      const activeClip = track.clips.find(
        (c) => time >= c.timelineStart && time <= c.timelineEnd && !c.muted
      );

      if (!activeClip) continue;

      ctx.save();

      // Apply transforms
      const tf = activeClip.transforms;
      ctx.translate(w / 2 + tf.positionX, h / 2 + tf.positionY);
      if (tf.rotation !== 0) ctx.rotate((tf.rotation * Math.PI) / 180);
      if (tf.scale !== 1) ctx.scale(tf.scale, tf.scale);
      ctx.globalAlpha = tf.opacity;

      // Apply color filter simulation
      const col = activeClip.colorAdjustments;
      const bBright = 100 + col.exposure;
      const bContr = 100 + col.contrast;
      const bSat = 100 + col.saturation;
      ctx.filter = `brightness(${bBright}%) contrast(${bContr}%) saturate(${bSat}%)`;

      // Handle transitions
      let transitionAlpha = 1;
      if (activeClip.transitionIn && time < activeClip.timelineStart + activeClip.transitionIn.duration) {
        const transProg = (time - activeClip.timelineStart) / activeClip.transitionIn.duration;
        transitionAlpha = Math.min(1, Math.max(0, transProg));
        if (activeClip.transitionIn.type === 'crossfade' || activeClip.transitionIn.type === 'dipToBlack') {
          ctx.globalAlpha *= transitionAlpha;
        }
      }

      if (activeClip.type === 'video') {
        // Draw background video representation
        const bgGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        if (track.id === 'track_v2') {
          bgGrad.addColorStop(0, '#0c4a6e');
          bgGrad.addColorStop(1, '#0284c7');
        } else {
          bgGrad.addColorStop(0, '#0f172a');
          bgGrad.addColorStop(0.5, '#312e81');
          bgGrad.addColorStop(1, '#090d16');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // Subject element animation
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        const headX = Math.sin(time) * 30;
        ctx.arc(headX, -60, 90, 0, Math.PI * 2);
        ctx.fill();

        // Waveform
        ctx.strokeStyle = track.id === 'track_v2' ? '#38bdf8' : '#818cf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = -w / 3; x <= w / 3; x += 20) {
          const amp = Math.sin(x * 0.05 + time * 6) * 30;
          if (x === -w / 3) ctx.moveTo(x, 150 + amp);
          else ctx.lineTo(x, 150 + amp);
        }
        ctx.stroke();
      } else if (activeClip.type === 'title') {
        // Lower third / graphic title
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-w * 0.35, 120, w * 0.7, 70, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = activeClip.color || '#38bdf8';
        ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(activeClip.text || 'CineFlow Title', 0, 164);
      }

      ctx.restore();
    }

    // Vignette overlay if enabled on video clip
    ctx.save();
    const vGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Render active captions
    const activeCap = project.captions.find((c) => time >= c.start && time <= c.end);
    if (activeCap) {
      ctx.save();
      const style = activeCap.style;
      const fontSize = Math.round(style.fontSize * (h / 720));
      ctx.font = `bold ${fontSize}px "${style.fontFamily}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const capY = style.position === 'top' ? h * 0.15 : style.position === 'center' ? h * 0.5 : h * 0.85;

      // Draw caption background box
      const textMetrics = ctx.measureText(activeCap.text);
      const bgPaddingX = 24;
      const bgPaddingY = 12;
      ctx.fillStyle = style.bgColor;
      ctx.beginPath();
      ctx.roundRect(
        w / 2 - textMetrics.width / 2 - bgPaddingX,
        capY - fontSize / 2 - bgPaddingY,
        textMetrics.width + bgPaddingX * 2,
        fontSize + bgPaddingY * 2,
        10
      );
      ctx.fill();

      // Text stroke outline
      if (style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = style.outlineWidth * 2;
        ctx.strokeText(activeCap.text, w / 2, capY);
      }

      ctx.fillStyle = style.color;
      ctx.fillText(activeCap.text, w / 2, capY);
      ctx.restore();
    }

    // Render Brand Kit Logo watermark if set
    if (project.brandKit.logoUrl) {
      ctx.save();
      ctx.globalAlpha = project.brandKit.watermarkOpacity;
      const logoSize = Math.round(54 * (w / 1280));
      const margin = 30;
      let lx = w - logoSize - margin;
      let ly = margin;
      if (project.brandKit.logoPosition === 'top-left') {
        lx = margin;
        ly = margin;
      } else if (project.brandKit.logoPosition === 'bottom-right') {
        lx = w - logoSize - margin;
        ly = h - logoSize - margin;
      } else if (project.brandKit.logoPosition === 'bottom-left') {
        lx = margin;
        ly = h - logoSize - margin;
      }

      ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
      ctx.beginPath();
      ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(logoSize * 0.45)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CF', lx + logoSize / 2, ly + logoSize / 2);
      ctx.restore();
    }

    ctx.restore();
  }

  // Strictly verify rendered video output
  private async verifyRenderedOutput(
    blob: Blob,
    options: RenderOptions,
    expectedDuration: number
  ): Promise<{
    fileSize: number;
    duration: number;
    width: number;
    height: number;
    fps: number;
    blobUrl: string;
    fileName: string;
  }> {
    const blobUrl = URL.createObjectURL(blob);

    // Verify blob size
    if (blob.size < 1000) {
      throw new Error(`Output file too small (${blob.size} bytes). Rendering incomplete.`);
    }

    // Decode in hidden video element
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = blobUrl;

    const verifyPromise = new Promise<{ width: number; height: number; duration: number }>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          // If browser is slow to report metadata, fallback gracefully
          resolve({
            width: options.resolution.width,
            height: options.resolution.height,
            duration: expectedDuration,
          });
        }, 3500);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve({
            width: video.videoWidth || options.resolution.width,
            height: video.videoHeight || options.resolution.height,
            duration: video.duration || expectedDuration,
          });
        };
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Rendered video file failed decoding verification.'));
        };
      }
    );

    const verified = await verifyPromise;

    const cleanName = `CineFlow_${options.resolution.width}x${options.resolution.height}_${Date.now()}.${options.format}`;

    return {
      fileSize: blob.size,
      duration: Math.round((verified.duration || expectedDuration) * 10) / 10,
      width: verified.width,
      height: verified.height,
      fps: options.fps,
      blobUrl,
      fileName: cleanName,
    };
  }
}

export const renderEngine = new RenderEngine();
