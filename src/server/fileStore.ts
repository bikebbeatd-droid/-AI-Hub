import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileItem } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../data/uploads');

export class FileStore {
  private files: Map<string, FileItem> = new Map();

  constructor() {
    this.ensureDir();
    this.loadExistingFiles();
  }

  private ensureDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  private loadExistingFiles() {
    try {
      const metadataPath = path.join(UPLOADS_DIR, '_metadata.json');
      if (fs.existsSync(metadataPath)) {
        const raw = fs.readFileSync(metadataPath, 'utf-8');
        const list: FileItem[] = JSON.parse(raw);
        for (const item of list) {
          this.files.set(item.id, item);
        }
      }
    } catch (e) {
      console.warn('Could not load existing file metadata:', e);
    }
  }

  private persistMetadata() {
    try {
      const metadataPath = path.join(UPLOADS_DIR, '_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(Array.from(this.files.values()), null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to persist file metadata:', e);
    }
  }

  public getAll(): FileItem[] {
    return Array.from(this.files.values()).sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  public getById(id: string): FileItem | undefined {
    return this.files.get(id);
  }

  public getFilePath(id: string): string | null {
    const item = this.files.get(id);
    if (!item) return null;
    const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.resolve(UPLOADS_DIR, `${id}_${safeName}`);
    if (!filePath.startsWith(UPLOADS_DIR)) {
      console.warn('Path traversal attempt detected:', filePath);
      return null;
    }
    return fs.existsSync(filePath) ? filePath : null;
  }

  public saveFile(file: {
    name: string;
    size: number;
    type: string;
    base64Data?: string;
    textContent?: string;
    isGenerated?: boolean;
    projectId?: string;
  }): FileItem {
    const id = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const extension = path.extname(file.name).toLowerCase().replace(/^\./, '');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskPath = path.resolve(UPLOADS_DIR, `${id}_${safeName}`);

    if (!diskPath.startsWith(UPLOADS_DIR)) {
      throw new Error('Invalid file path or unsafe file name');
    }

    let textContent = file.textContent || '';
    let previewUrl: string | undefined = undefined;

    if (file.base64Data) {
      const cleanBase64 = file.base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // Max 50MB decoded file limit check
      if (buffer.length > 50 * 1024 * 1024) {
        throw new Error('File exceeds maximum allowed limit of 50 MB.');
      }

      fs.writeFileSync(diskPath, buffer);

      if (file.type.startsWith('image/')) {
        previewUrl = file.base64Data.startsWith('data:') 
          ? file.base64Data 
          : `data:${file.type};base64,${cleanBase64}`;
      } else if (!textContent && (
        file.type.includes('text') || 
        file.type.includes('json') || 
        file.type.includes('javascript') || 
        file.type.includes('typescript') ||
        ['txt', 'md', 'json', 'csv', 'ts', 'js', 'py', 'html', 'css', 'yaml', 'yml'].includes(extension)
      )) {
        textContent = buffer.toString('utf-8');
      }
    } else if (file.textContent) {
      fs.writeFileSync(diskPath, file.textContent, 'utf-8');
    }

    const item: FileItem = {
      id,
      name: file.name,
      size: file.size || (fs.existsSync(diskPath) ? fs.statSync(diskPath).size : 0),
      type: file.type || 'application/octet-stream',
      extension,
      url: `/api/files/${id}/download`,
      previewUrl,
      uploadedAt: Date.now(),
      status: 'ready',
      textContent: textContent || undefined,
      isGenerated: file.isGenerated,
      projectId: file.projectId
    };

    this.files.set(id, item);
    this.persistMetadata();
    return item;
  }

  public renameFile(id: string, newName: string): FileItem | null {
    const item = this.files.get(id);
    if (!item) return null;

    const oldDiskPath = path.resolve(UPLOADS_DIR, `${id}_${item.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    const safeNewName = newName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const newDiskPath = path.resolve(UPLOADS_DIR, `${id}_${safeNewName}`);

    if (!oldDiskPath.startsWith(UPLOADS_DIR) || !newDiskPath.startsWith(UPLOADS_DIR)) {
      return null;
    }

    if (fs.existsSync(oldDiskPath)) {
      try {
        fs.renameSync(oldDiskPath, newDiskPath);
      } catch (e) {
        console.warn('Failed to rename on disk:', e);
      }
    }

    item.name = newName;
    item.extension = path.extname(newName).toLowerCase().replace(/^\./, '');
    this.persistMetadata();
    return item;
  }

  public deleteFile(id: string): boolean {
    const item = this.files.get(id);
    if (!item) return false;

    const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const diskPath = path.resolve(UPLOADS_DIR, `${id}_${safeName}`);

    if (diskPath.startsWith(UPLOADS_DIR) && fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn('Failed to remove file from disk:', e);
      }
    }

    this.files.delete(id);
    this.persistMetadata();
    return true;
  }

  public deleteAll(): { count: number } {
    let count = 0;
    const ids = Array.from(this.files.keys());
    for (const id of ids) {
      if (this.deleteFile(id)) count++;
    }

    // Clean any remaining disk files
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        const diskFiles = fs.readdirSync(UPLOADS_DIR);
        for (const file of diskFiles) {
          if (file !== '_metadata.json') {
            const fp = path.resolve(UPLOADS_DIR, file);
            if (fp.startsWith(UPLOADS_DIR) && fs.existsSync(fp)) {
              fs.unlinkSync(fp);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error clearing disk files:', e);
    }

    this.files.clear();
    this.persistMetadata();
    return { count };
  }

  public cleanupOrphans(): { cleanedMetadata: number; cleanedDiskFiles: number } {
    let cleanedMetadata = 0;
    let cleanedDiskFiles = 0;

    // 1. Remove metadata entries whose files do not exist on disk
    for (const [id, item] of Array.from(this.files.entries())) {
      const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskPath = path.resolve(UPLOADS_DIR, `${id}_${safeName}`);
      if (!fs.existsSync(diskPath)) {
        this.files.delete(id);
        cleanedMetadata++;
      }
    }

    // 2. Remove files on disk that have no metadata entry
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        const diskFiles = fs.readdirSync(UPLOADS_DIR);
        const knownDiskNames = new Set(
          Array.from(this.files.values()).map(m => `${m.id}_${m.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
        );

        for (const filename of diskFiles) {
          if (filename === '_metadata.json') continue;
          if (!knownDiskNames.has(filename)) {
            const fp = path.resolve(UPLOADS_DIR, filename);
            if (fp.startsWith(UPLOADS_DIR) && fs.existsSync(fp)) {
              fs.unlinkSync(fp);
              cleanedDiskFiles++;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Orphan disk cleanup error:', e);
    }

    this.persistMetadata();
    return { cleanedMetadata, cleanedDiskFiles };
  }
}
