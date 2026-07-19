import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

interface Block {
  type: 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'hr' | 'blockquote';
  items?: string[]; // for lists
  content?: string; // for others
}

function parseInline(text: string): React.ReactNode[] {
  // Regex to split by bold (**), links ([text](url)), inline code (`code`), or italics (*)
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\)|`.*?`|\*.*?\*)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-900">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-slate-800">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-violet-600 border border-slate-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [, linkText, url] = match;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-800 underline font-semibold transition"
          >
            {linkText}
          </a>
        );
      }
    }
    return part;
  });
}

function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const commitList = () => {
    if (currentList) {
      blocks.push({
        type: currentList.type,
        items: currentList.items
      });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      commitList();
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      commitList();
      blocks.push({ type: 'hr' });
      continue;
    }

    // Headers
    if (trimmed.startsWith('#')) {
      commitList();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = match[2];
        blocks.push({
          type: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3',
          content
        });
      } else {
        blocks.push({ type: 'p', content: trimmed });
      }
      continue;
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      commitList();
      const content = trimmed.replace(/^>\s*/, '');
      blocks.push({ type: 'blockquote', content });
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^(\s*)[\*\-\+]\s+(.*)$/);
    if (ulMatch) {
      const content = ulMatch[2];
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(content);
      } else {
        commitList();
        currentList = { type: 'ul', items: [content] };
      }
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      const content = olMatch[2];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(content);
      } else {
        commitList();
        currentList = { type: 'ol', items: [content] };
      }
      continue;
    }

    // Plain paragraph text
    commitList();
    
    if (blocks.length > 0 && blocks[blocks.length - 1].type === 'p') {
      blocks[blocks.length - 1].content += ' ' + trimmed;
    } else {
      blocks.push({ type: 'p', content: trimmed });
    }
  }

  commitList();
  return blocks;
}

export default function MarkdownRenderer({ text }: MarkdownRendererProps) {
  if (!text) return null;
  const blocks = markdownToBlocks(text);

  return (
    <div className="space-y-3.5 text-sm text-slate-700 leading-relaxed font-normal">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={index} className="text-xl font-black text-slate-900 pt-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                {parseInline(block.content || '')}
              </h1>
            );
          case 'h2':
            return (
              <h2 key={index} className="text-lg font-extrabold text-slate-800 pt-2 pb-0.5 flex items-center gap-1.5">
                {parseInline(block.content || '')}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={index} className="text-base font-bold text-slate-800 pt-1 flex items-center gap-1.5">
                {parseInline(block.content || '')}
              </h3>
            );
          case 'ul':
            return (
              <ul key={index} className="list-disc pl-5 space-y-2 my-2 text-slate-700">
                {block.items?.map((item, i) => (
                  <li key={i} className="leading-relaxed pl-0.5">
                    {parseInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index} className="list-decimal pl-5 space-y-2 my-2 text-slate-700">
                {block.items?.map((item, i) => (
                  <li key={i} className="leading-relaxed pl-0.5">
                    {parseInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'hr':
            return <hr key={index} className="my-5 border-slate-200" />;
          case 'blockquote':
            return (
              <blockquote key={index} className="pl-3.5 border-l-4 border-violet-500 bg-slate-50/70 py-2 px-3 my-3 text-slate-600 italic rounded-r-lg">
                {parseInline(block.content || '')}
              </blockquote>
            );
          case 'p':
          default:
            return (
              <p key={index} className="leading-relaxed">
                {parseInline(block.content || '')}
              </p>
            );
        }
      })}
    </div>
  );
}
