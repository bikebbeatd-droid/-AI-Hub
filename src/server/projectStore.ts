import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProjectItem } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

export class ProjectStore {
  private projects: Map<string, ProjectItem> = new Map();

  constructor() {
    this.ensureDir();
    this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load() {
    try {
      if (fs.existsSync(PROJECTS_FILE)) {
        const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
        const list: ProjectItem[] = JSON.parse(raw);
        for (const item of list) {
          this.projects.set(item.id, item);
        }
      } else {
        // Seed default starter project
        const defaultProject: ProjectItem = {
          id: 'proj_default',
          title: 'General Workspace',
          description: 'Default multi-turn assistant workspace for reasoning, coding, and file analysis.',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          systemInstruction: 'You are an intelligent, helpful, and versatile AI assistant. Answer accurately with code blocks, math formatting, and structured insights.',
          conversationIds: [],
          fileIds: []
        };
        this.projects.set(defaultProject.id, defaultProject);
        this.save();
      }
    } catch (e) {
      console.warn('Failed to load projects:', e);
    }
  }

  private save() {
    try {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(Array.from(this.projects.values()), null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save projects:', e);
    }
  }

  public getAll(): ProjectItem[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getById(id: string): ProjectItem | undefined {
    return this.projects.get(id);
  }

  public create(data: { title: string; description?: string; systemInstruction?: string; defaultModelId?: string }): ProjectItem {
    const id = 'proj_' + Date.now();
    const item: ProjectItem = {
      id,
      title: data.title,
      description: data.description || '',
      systemInstruction: data.systemInstruction || '',
      defaultModelId: data.defaultModelId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      conversationIds: [],
      fileIds: []
    };
    this.projects.set(id, item);
    this.save();
    return item;
  }

  public update(id: string, updates: Partial<ProjectItem>): ProjectItem | null {
    const item = this.projects.get(id);
    if (!item) return null;
    const updated = {
      ...item,
      ...updates,
      updatedAt: Date.now()
    };
    this.projects.set(id, updated);
    this.save();
    return updated;
  }

  public delete(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) this.save();
    return deleted;
  }
}
