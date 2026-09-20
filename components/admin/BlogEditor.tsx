'use client';

import { useState, useMemo } from 'react';
import {
  Heading,
  Pilcrow,
  Image as ImageIcon,
  Youtube,
  Quote,
  List,
  ListOrdered,
  Code,
  Lightbulb,
  Minus,
  MousePointerClick,
  Link as LinkIcon,
  Bot,
  BookOpen,
  FileText,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  Eye,
  PencilLine,
} from 'lucide-react';

// ----------------------------- Types -----------------------------

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'quote'
  | 'bullet_list'
  | 'numbered_list'
  | 'code_block'
  | 'callout'
  | 'divider'
  | 'button'
  | 'embed'
  | 'ai_tool_card'
  | 'glossary_card'
  | 'related_article';

export interface BlockData {
  // heading
  text?: string;
  level?: 2 | 3 | 4;
  // image
  url?: string;
  alt?: string;
  caption?: string;
  // quote
  author?: string;
  // lists / code
  items?: string;
  code?: string;
  language?: string;
  // callout
  variant?: 'info' | 'warning' | 'success';
  // button
  // embed
  embedType?: string;
  // ai_tool_card / glossary_card / related_article
  name?: string;
  term?: string;
  title?: string;
  slug?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
}

interface BlogEditorProps {
  initialBlocks?: Block[];
  onChange?: (blocks: Block[]) => void;
  onAIClick?: (action: string) => void;
}

// ----------------------------- Block catalog -----------------------------

interface BlockMeta {
  type: BlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultData: BlockData;
}

const BLOCK_CATALOG: BlockMeta[] = [
  { type: 'heading', label: 'Heading', icon: Heading, defaultData: { text: '', level: 2 } },
  { type: 'paragraph', label: 'Paragraph', icon: Pilcrow, defaultData: { text: '' } },
  { type: 'image', label: 'Image', icon: ImageIcon, defaultData: { url: '', alt: '', caption: '' } },
  { type: 'video', label: 'Video', icon: Youtube, defaultData: { url: '' } },
  { type: 'quote', label: 'Quote', icon: Quote, defaultData: { text: '', author: '' } },
  { type: 'bullet_list', label: 'Bullet List', icon: List, defaultData: { items: '' } },
  { type: 'numbered_list', label: 'Numbered List', icon: ListOrdered, defaultData: { items: '' } },
  { type: 'code_block', label: 'Code Block', icon: Code, defaultData: { code: '', language: '' } },
  { type: 'callout', label: 'Callout', icon: Lightbulb, defaultData: { text: '', variant: 'info' } },
  { type: 'divider', label: 'Divider', icon: Minus, defaultData: {} },
  { type: 'button', label: 'Button', icon: MousePointerClick, defaultData: { text: '', url: '' } },
  { type: 'embed', label: 'Embed', icon: LinkIcon, defaultData: { url: '', embedType: 'twitter' } },
  { type: 'ai_tool_card', label: 'AI Tool Card', icon: Bot, defaultData: { name: '', slug: '' } },
  { type: 'glossary_card', label: 'Glossary Card', icon: BookOpen, defaultData: { term: '', slug: '' } },
  { type: 'related_article', label: 'Related Article', icon: FileText, defaultData: { title: '', slug: '' } },
];

const BLOCK_MAP: Record<BlockType, BlockMeta> = BLOCK_CATALOG.reduce(
  (acc, meta) => ({ ...acc, [meta.type]: meta }),
  {} as Record<BlockType, BlockMeta>
);

const AI_ACTIONS = [
  { action: 'simplify', label: 'Simplify' },
  { action: 'improve', label: 'Improve' },
  { action: 'seo', label: 'Generate SEO' },
  { action: 'title', label: 'Generate Title' },
  { action: 'summary', label: 'Create Summary' },
];

// ----------------------------- Helpers -----------------------------

let blockCounter = 0;
function makeId() {
  blockCounter += 1;
  return `block-${Date.now()}-${blockCounter}`;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ----------------------------- Styling -----------------------------

const inputClass =
  'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

// ----------------------------- Component -----------------------------

export default function BlogEditor({ initialBlocks = [], onChange, onAIClick }: BlogEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [preview, setPreview] = useState(false);

  const emit = (next: Block[]) => {
    setBlocks(next);
    onChange?.(next);
  };

  const addBlock = (type: BlockType) => {
    const meta = BLOCK_MAP[type];
    const newBlock: Block = { id: makeId(), type, data: { ...meta.defaultData } };
    emit([...blocks, newBlock]);
    setShowAddMenu(false);
  };

  const updateBlock = (id: string, data: Partial<BlockData>) => {
    emit(blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)));
  };

  const changeBlockType = (id: string, type: BlockType) => {
    const meta = BLOCK_MAP[type];
    emit(blocks.map((b) => (b.id === id ? { ...b, type, data: { ...meta.defaultData } } : b)));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    emit(next);
  };

  const deleteBlock = (id: string) => {
    emit(blocks.filter((b) => b.id !== id));
  };

  const exportJSON = (): string => JSON.stringify(blocks);

  return (
    <div className="space-y-4">
      {/* AI action row */}
      <div className="glass rounded-xl border border-white/8 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-blue" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Assistant</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_ACTIONS.map((a) => (
            <button
              key={a.action}
              onClick={() => onAIClick?.(a.action)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-brand-blue/10 border border-brand-blue/20 hover:bg-brand-blue/20 hover:border-brand-blue/40 transition-all"
              style={{ boxShadow: '0 0 12px rgba(74,108,247,0.15)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-colors"
        >
          {preview ? <PencilLine className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Blocks */}
      {blocks.length === 0 && !preview && (
        <div className="glass rounded-xl border border-white/8 p-10 text-center">
          <Pilcrow className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">No blocks yet. Add your first block to get started.</p>
          <button
            onClick={() => setShowAddMenu(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 btn-gradient text-white text-sm font-medium rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Block
          </button>
        </div>
      )}

      <div className="space-y-3">
        {preview ? (
          <div className="glass rounded-xl border border-white/8 p-6 lg:p-8 space-y-4">
            <BlockPreview blocks={blocks} />
          </div>
        ) : (
          blocks.map((block, idx) => {
            const meta = BLOCK_MAP[block.type];
            const Icon = meta.icon;
            return (
              <div key={block.id} className="glass rounded-xl border border-white/8 overflow-hidden">
                {/* Block header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/[0.02]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className="w-4 h-4 text-brand-blue shrink-0" />
                    <select
                      value={block.type}
                      onChange={(e) => changeBlockType(block.id, e.target.value as BlockType)}
                      className="bg-transparent text-sm font-medium text-white border-none focus:outline-none cursor-pointer"
                    >
                      {BLOCK_CATALOG.map((m) => (
                        <option key={m.type} value={m.type} className="bg-brand-800">
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveBlock(block.id, -1)}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveBlock(block.id, 1)}
                      disabled={idx === blocks.length - 1}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10"
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Block fields */}
                <div className="p-4 space-y-3">
                  <BlockFields block={block} updateBlock={updateBlock} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add block */}
      {!preview && (
        <div className="relative">
          {showAddMenu ? (
            <div className="glass rounded-xl border border-white/8 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Add a block</span>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BLOCK_CATALOG.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.type}
                  onClick={() => addBlock(m.type)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-brand-800 border border-white/10 hover:border-brand-blue/50 hover:bg-brand-700 transition-all text-center"
                >
                  <Icon className="w-5 h-5 text-brand-blue" />
                  <span className="text-xs text-white">{m.label}</span>
                </button>
              );
            })}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddMenu(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-white/15 text-gray-400 hover:text-white hover:border-brand-blue/50 hover:bg-white/[0.02] transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Block
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------- Block fields -----------------------------

function BlockFields({
  block,
  updateBlock,
}: {
  block: Block;
  updateBlock: (id: string, data: Partial<BlockData>) => void;
}) {
  const { id, type, data } = block;

  switch (type) {
    case 'heading':
      return (
        <>
          <div>
            <label className={labelClass}>Heading text</label>
            <input
              type="text"
              value={data.text || ''}
              onChange={(e) => updateBlock(id, { text: e.target.value })}
              placeholder="Section heading..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Level</label>
            <select
              value={data.level || 2}
              onChange={(e) => updateBlock(id, { level: Number(e.target.value) as 2 | 3 | 4 })}
              className={inputClass}
            >
              <option value={2} className="bg-brand-800">H2 — Section</option>
              <option value={3} className="bg-brand-800">H3 — Subsection</option>
              <option value={4} className="bg-brand-800">H4 — Minor</option>
            </select>
          </div>
        </>
      );

    case 'paragraph':
      return (
        <textarea
          value={data.text || ''}
          onChange={(e) => updateBlock(id, { text: e.target.value })}
          placeholder="Write your paragraph..."
          rows={5}
          className={`${inputClass} resize-y`}
        />
      );

    case 'image':
      return (
        <>
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              type="url"
              value={data.url || ''}
              onChange={(e) => updateBlock(id, { url: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Alt text</label>
            <input
              type="text"
              value={data.alt || ''}
              onChange={(e) => updateBlock(id, { alt: e.target.value })}
              placeholder="Describe the image..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Caption (optional)</label>
            <input
              type="text"
              value={data.caption || ''}
              onChange={(e) => updateBlock(id, { caption: e.target.value })}
              placeholder="Image caption..."
              className={inputClass}
            />
          </div>
          {data.url && (
            <div className="rounded-lg overflow-hidden h-40 bg-brand-800">
              <img src={data.url} alt={data.alt || ''} className="w-full h-full object-cover" />
            </div>
          )}
        </>
      );

    case 'video':
      return (
        <>
          <div>
            <label className={labelClass}>YouTube URL</label>
            <input
              type="url"
              value={data.url || ''}
              onChange={(e) => updateBlock(id, { url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClass}
            />
          </div>
          {data.url && extractYouTubeId(data.url) && (
            <div className="rounded-lg overflow-hidden aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(data.url)}`}
                title="YouTube preview"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </>
      );

    case 'quote':
      return (
        <>
          <div>
            <label className={labelClass}>Quote text</label>
            <textarea
              value={data.text || ''}
              onChange={(e) => updateBlock(id, { text: e.target.value })}
              placeholder="The quote..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>Author</label>
            <input
              type="text"
              value={data.author || ''}
              onChange={(e) => updateBlock(id, { author: e.target.value })}
              placeholder="Attribution..."
              className={inputClass}
            />
          </div>
        </>
      );

    case 'bullet_list':
    case 'numbered_list':
      return (
        <>
          <label className={labelClass}>Items (one per line)</label>
          <textarea
            value={data.items || ''}
            onChange={(e) => updateBlock(id, { items: e.target.value })}
            placeholder={'First item\nSecond item\nThird item'}
            rows={6}
            className={`${inputClass} resize-y`}
          />
        </>
      );

    case 'code_block':
      return (
        <>
          <div>
            <label className={labelClass}>Language (optional)</label>
            <input
              type="text"
              value={data.language || ''}
              onChange={(e) => updateBlock(id, { language: e.target.value })}
              placeholder="javascript, python, sql..."
              className={inputClass}
            />
          </div>
          <label className={labelClass}>Code</label>
          <textarea
            value={data.code || ''}
            onChange={(e) => updateBlock(id, { code: e.target.value })}
            placeholder="// your code here"
            rows={8}
            className={`${inputClass} resize-y font-mono text-xs`}
          />
        </>
      );

    case 'callout':
      return (
        <>
          <div>
            <label className={labelClass}>Variant</label>
            <select
              value={data.variant || 'info'}
              onChange={(e) => updateBlock(id, { variant: e.target.value as 'info' | 'warning' | 'success' })}
              className={inputClass}
            >
              <option value="info" className="bg-brand-800">Info</option>
              <option value="warning" className="bg-brand-800">Warning</option>
              <option value="success" className="bg-brand-800">Success</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Callout text</label>
            <textarea
              value={data.text || ''}
              onChange={(e) => updateBlock(id, { text: e.target.value })}
              placeholder="Important note..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </>
      );

    case 'divider':
      return (
        <div className="flex items-center gap-3 py-2 text-gray-500">
          <div className="h-px bg-white/15 flex-1" />
          <Minus className="w-4 h-4" />
          <span className="text-xs">Horizontal divider</span>
          <div className="h-px bg-white/15 flex-1" />
        </div>
      );

    case 'button':
      return (
        <>
          <div>
            <label className={labelClass}>Button text</label>
            <input
              type="text"
              value={data.text || ''}
              onChange={(e) => updateBlock(id, { text: e.target.value })}
              placeholder="Click here..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Button URL</label>
            <input
              type="url"
              value={data.url || ''}
              onChange={(e) => updateBlock(id, { url: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );

    case 'embed':
      return (
        <>
          <div>
            <label className={labelClass}>Embed type</label>
            <select
              value={data.embedType || 'twitter'}
              onChange={(e) => updateBlock(id, { embedType: e.target.value })}
              className={inputClass}
            >
              <option value="twitter" className="bg-brand-800">Twitter / X</option>
              <option value="youtube" className="bg-brand-800">YouTube</option>
              <option value="spotify" className="bg-brand-800">Spotify</option>
              <option value="gist" className="bg-brand-800">GitHub Gist</option>
              <option value="other" className="bg-brand-800">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Embed URL</label>
            <input
              type="url"
              value={data.url || ''}
              onChange={(e) => updateBlock(id, { url: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </>
      );

    case 'ai_tool_card':
      return (
        <>
          <div>
            <label className={labelClass}>Tool name</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => updateBlock(id, { name: e.target.value })}
              placeholder="e.g. ChatGPT"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tool slug</label>
            <input
              type="text"
              value={data.slug || ''}
              onChange={(e) => updateBlock(id, { slug: e.target.value })}
              placeholder="chatgpt"
              className={inputClass}
            />
          </div>
        </>
      );

    case 'glossary_card':
      return (
        <>
          <div>
            <label className={labelClass}>Term</label>
            <input
              type="text"
              value={data.term || ''}
              onChange={(e) => updateBlock(id, { term: e.target.value })}
              placeholder="e.g. Neural Network"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Term slug</label>
            <input
              type="text"
              value={data.slug || ''}
              onChange={(e) => updateBlock(id, { slug: e.target.value })}
              placeholder="neural-network"
              className={inputClass}
            />
          </div>
        </>
      );

    case 'related_article':
      return (
        <>
          <div>
            <label className={labelClass}>Article title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => updateBlock(id, { title: e.target.value })}
              placeholder="Related article title..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Article slug</label>
            <input
              type="text"
              value={data.slug || ''}
              onChange={(e) => updateBlock(id, { slug: e.target.value })}
              placeholder="related-article-slug"
              className={inputClass}
            />
          </div>
        </>
      );

    default:
      return null;
  }
}

// ----------------------------- Preview -----------------------------

function BlockPreview({ blocks }: { blocks: Block[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Nothing to preview yet.</p>;
  }
  return (
    <article className="prose-invert max-w-none text-gray-200 space-y-4">
      {blocks.map((block) => (
        <PreviewBlock key={block.id} block={block} />
      ))}
    </article>
  );
}

function PreviewBlock({ block }: { block: Block }) {
  const { type, data } = block;

  switch (type) {
    case 'heading': {
      const level = data.level || 2;
      const cls =
        level === 2
          ? 'font-display font-bold text-2xl text-white mt-6'
          : level === 3
          ? 'font-display font-semibold text-xl text-white mt-5'
          : 'font-medium text-lg text-white mt-4';
      return <div className={cls}>{data.text || 'Untitled heading'}</div>;
    }

    case 'paragraph':
      return (
        <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
          {data.text || 'Empty paragraph'}
        </p>
      );

    case 'image':
      return (
        <figure className="space-y-2">
          {data.url ? (
            <img src={data.url} alt={data.alt || ''} className="w-full rounded-lg" />
          ) : (
            <div className="h-40 rounded-lg bg-brand-800 flex items-center justify-center text-xs text-gray-600">
              No image URL
            </div>
          )}
          {data.caption && (
            <figcaption className="text-xs text-center text-gray-500">{data.caption}</figcaption>
          )}
        </figure>
      );

    case 'video': {
      const ytId = extractYouTubeId(data.url || '');
      return ytId ? (
        <div className="rounded-lg overflow-hidden aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title="YouTube video"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : (
        <p className="text-xs text-gray-500">Invalid YouTube URL</p>
      );
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-brand-blue/60 pl-4 py-1 italic text-gray-300">
          <p className="text-sm">"{data.text || ''}"</p>
          {data.author && (
            <footer className="text-xs text-gray-500 mt-1 not-italic">— {data.author}</footer>
          )}
        </blockquote>
      );

    case 'bullet_list': {
      const items = (data.items || '').split('\n').filter(Boolean);
      return (
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    }

    case 'numbered_list': {
      const items = (data.items || '').split('\n').filter(Boolean);
      return (
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      );
    }

    case 'code_block':
      return (
        <pre className="rounded-lg bg-brand-950 border border-white/8 p-4 overflow-x-auto">
          {data.language && (
            <div className="text-xs text-gray-500 mb-2 font-mono">{data.language}</div>
          )}
          <code className="text-xs font-mono text-gray-200 whitespace-pre-wrap">
            {data.code || ''}
          </code>
        </pre>
      );

    case 'callout': {
      const styles: Record<string, string> = {
        info: 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue',
        warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
        success: 'border-green-500/30 bg-green-500/10 text-green-400',
      };
      const variant = data.variant || 'info';
      return (
        <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
          {data.text || ''}
        </div>
      );
    }

    case 'divider':
      return <hr className="border-white/15 my-4" />;

    case 'button':
      return data.url ? (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white text-sm font-medium rounded-xl"
        >
          {data.text || 'Button'}
        </a>
      ) : (
        <span className="inline-flex items-center px-5 py-2.5 bg-brand-700 text-white text-sm rounded-xl">
          {data.text || 'Button'}
        </span>
      );

    case 'embed':
      return (
        <div className="rounded-lg border border-white/8 p-4 text-center text-xs text-gray-500">
          Embed ({data.embedType}): {data.url || 'No URL'}
        </div>
      );

    case 'ai_tool_card':
      return (
        <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4 flex items-center gap-3">
          <Bot className="w-5 h-5 text-brand-blue" />
          <div>
            <div className="text-sm font-medium text-white">{data.name || 'AI Tool'}</div>
            {data.slug && <div className="text-xs text-gray-500">/tools/{data.slug}</div>}
          </div>
        </div>
      );

    case 'glossary_card':
      return (
        <div className="rounded-xl border border-brand-purple/20 bg-brand-purple/10 p-4 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-purple" />
          <div>
            <div className="text-sm font-medium text-white">{data.term || 'Glossary Term'}</div>
            {data.slug && <div className="text-xs text-gray-500">/glossary/{data.slug}</div>}
          </div>
        </div>
      );

    case 'related_article':
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-white">{data.title || 'Related Article'}</div>
            {data.slug && <div className="text-xs text-gray-500">/blog/{data.slug}</div>}
          </div>
        </div>
      );

    default:
      return null;
  }
}
