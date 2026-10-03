import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

interface AIResponseRendererProps {
  content: string;
  status?: 'streaming' | 'complete' | 'error';
  className?: string;
}

/**
 * Format raw JSON text into clean Markdown sections/headings if LLM returns JSON objects.
 */
function formatAiContent(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  // Check if text is a JSON Object or Array
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);

      // Single-key wrapper like { content: "..." } or { answer: "..." }
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && typeof parsed[keys[0]] === 'string') {
          return parsed[keys[0]];
        }

        // Multi-key dictionary of topics -> descriptions
        let markdownOutput = '';
        for (const [key, value] of Object.entries(parsed)) {
          if (value === null || value === undefined) continue;

          markdownOutput += `### ${key}\n\n`;

          if (typeof value === 'string') {
            markdownOutput += `${value}\n\n`;
          } else if (Array.isArray(value)) {
            value.forEach((item) => {
              markdownOutput += `- ${typeof item === 'object' ? JSON.stringify(item) : item}\n`;
            });
            markdownOutput += '\n';
          } else if (typeof value === 'object') {
            for (const [subKey, subVal] of Object.entries(value as Record<string, any>)) {
              markdownOutput += `- **${subKey}**: ${subVal}\n`;
            }
            markdownOutput += '\n';
          } else {
            markdownOutput += `${value}\n\n`;
          }
        }
        return markdownOutput.trim();
      } else if (Array.isArray(parsed)) {
        let markdownOutput = '';
        parsed.forEach((item, idx) => {
          if (typeof item === 'string') {
            markdownOutput += `${idx + 1}. ${item}\n`;
          } else if (typeof item === 'object' && item !== null) {
            markdownOutput += `### Item ${idx + 1}\n\n`;
            for (const [k, v] of Object.entries(item)) {
              markdownOutput += `- **${k}**: ${v}\n`;
            }
            markdownOutput += '\n';
          }
        });
        return markdownOutput.trim();
      }
    } catch {
      // Return raw text if JSON parse fails
    }
  }

  return text;
}

/**
 * AI Response Renderer Component:
 * Automatically parses raw JSON output from structured LLM responses into Markdown.
 * Renders headings, lists, bold/italic, code blocks, blockquotes, tables, and streaming cursor.
 */
export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({
  content,
  status,
  className,
}) => {
  const isStreaming = status === 'streaming';
  const formattedContent = useMemo(() => formatAiContent(content), [content]);

  return (
    <div
      className={cn(
        'markdown-content text-xs leading-relaxed space-y-2 select-text break-words [overflow-wrap:anywhere]',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children, ...props }) {
            return (
              <h1 className="text-sm font-extrabold tracking-tight text-foreground mt-3.5 mb-1.5 border-b border-border/40 pb-1" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="text-xs font-bold text-foreground mt-3 mb-1" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3 className="text-xs font-bold text-primary mt-2.5 mb-1 flex items-center gap-1.5" {...props}>
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                <span>{children}</span>
              </h3>
            );
          },
          p({ children, ...props }) {
            return (
              <p className="text-xs leading-relaxed text-foreground/90 my-1 font-sans" {...props}>
                {children}
              </p>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-1.5 text-xs text-foreground/90 pl-1" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-1.5 text-xs text-foreground/90 pl-1" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="text-xs text-foreground/90 leading-relaxed my-0.5" {...props}>
                {children}
              </li>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors font-medium"
                {...props}
              >
                {children}
              </a>
            );
          },
          code({ className: codeClassName, children, ...props }) {
            const isInline = !codeClassName && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="font-mono text-[11px] bg-muted/80 text-foreground px-1.5 py-0.5 rounded border border-border/50 break-words"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn('font-mono text-[11px] text-foreground block', codeClassName)}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children, ...props }) {
            return (
              <pre
                className="bg-muted/90 border border-border/80 rounded-xl p-3.5 my-2.5 overflow-x-auto text-[11px] font-mono text-foreground leading-normal shadow-xs"
                {...props}
              >
                {children}
              </pre>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="my-3 overflow-x-auto rounded-xl border border-border/70 shadow-xs">
                <table className="w-full text-left border-collapse text-xs" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-3 border-primary/70 pl-3.5 italic my-2.5 text-muted-foreground bg-muted/20 py-1.5 rounded-r-lg"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
        }}
      >
        {formattedContent}
      </ReactMarkdown>

      {isStreaming && (
        <span
          className="inline-block h-3.5 w-1.5 ml-0.5 bg-primary animate-pulse align-middle rounded-xs"
          title="Streaming response..."
        />
      )}
    </div>
  );
};
