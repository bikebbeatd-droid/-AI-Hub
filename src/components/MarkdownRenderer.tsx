import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  // Pre-process math expressions to styled spans before marked
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    // Replace block math $$...$$
    let formatted = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
      return `\n<div class="math-block font-mono bg-neutral-100 dark:bg-neutral-900/80 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 text-center my-2 text-sm overflow-x-auto select-all"><code>${math.trim()}</code></div>\n`;
    });

    // Replace inline math $...$
    formatted = formatted.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (_, prefix, math) => {
      return `${prefix}<span class="math-inline font-mono bg-neutral-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700 select-all">${math.trim()}</span>`;
    });

    return formatted;
  }, [content]);

  // Parse Markdown to HTML
  const parsedHtml = React.useMemo(() => {
    try {
      return marked.parse(processedContent, {
        gfm: true,
        breaks: true
      }) as string;
    } catch {
      return content;
    }
  }, [processedContent]);

  // Click delegation for copy code buttons inside markdown
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button[data-code-copy]');
    if (button) {
      const codeElement = button.closest('.code-block-wrapper')?.querySelector('pre code');
      if (codeElement && codeElement.textContent) {
        navigator.clipboard.writeText(codeElement.textContent);
        const id = button.getAttribute('data-code-id') || 'code';
        setCopiedBlockId(id);
        setTimeout(() => setCopiedBlockId(null), 2000);
      }
    }
  };

  // Enhance pre blocks with custom header and copy button
  const enhancedHtml = React.useMemo(() => {
    let blockIndex = 0;
    return parsedHtml.replace(
      /<pre><code(?:\s+class="language-([a-zA-Z0-9_-]+)")?>([\s\S]*?)<\/code><\/pre>/gi,
      (_, lang, codeContent) => {
        const id = `code_block_${++blockIndex}`;
        const languageLabel = (lang || 'code').toUpperCase();
        return `
          <div class="code-block-wrapper my-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-neutral-100 shadow-xs">
            <div class="flex items-center justify-between px-3.5 py-2 bg-neutral-950/80 border-b border-neutral-800 text-xs font-mono text-neutral-400">
              <span class="flex items-center gap-1.5 font-semibold text-neutral-300">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                ${languageLabel}
              </span>
              <button 
                type="button"
                data-code-copy="true"
                data-code-id="${id}"
                class="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                title="Copy code"
              >
                <span>${copiedBlockId === id ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre class="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed bg-neutral-900 text-neutral-100 m-0"><code>${codeContent}</code></pre>
          </div>
        `;
      }
    );
  }, [parsedHtml, copiedBlockId]);

  return (
    <div 
      onClick={handleContainerClick}
      className="prose prose-neutral dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words
        [&>p]:mb-3 [&>p:last-child]:mb-0
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ul>li]:mb-1
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>ol>li]:mb-1
        [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table]:rounded-lg [&>table]:overflow-hidden [&>table]:border [&>table]:border-neutral-200 dark:[&>table]:border-neutral-800
        [&>table_th]:border [&>table_th]:border-neutral-200 dark:[&>table_th]:border-neutral-800 [&>table_th]:p-2.5 [&>table_th]:bg-neutral-100 dark:[&>table_th]:bg-neutral-900 [&>table_th]:text-xs [&>table_th]:font-semibold [&>table_th]:text-left
        [&>table_td]:border [&>table_td]:border-neutral-200 dark:[&>table_td]:border-neutral-800 [&>table_td]:p-2.5 [&>table_td]:text-xs sm:[&>table_td]:text-sm
        [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:py-1 [&>blockquote]:my-3 [&>blockquote]:text-neutral-600 dark:[&>blockquote]:text-neutral-400 [&>blockquote]:italic
        [&>h1]:text-xl [&>h1]:font-bold [&>h1]:my-3
        [&>h2]:text-lg [&>h2]:font-bold [&>h2]:my-2.5
        [&>h3]:text-base [&>h3]:font-semibold [&>h3]:my-2
        [&>hr]:border-neutral-200 dark:[&>hr]:border-neutral-800 [&>hr]:my-4
        [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-3 [&_img]:border [&_img]:border-neutral-200 dark:[&_img]:border-neutral-800
        [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline hover:[&_a]:opacity-80"
      dangerouslySetInnerHTML={{ __html: enhancedHtml }}
    />
  );
};
