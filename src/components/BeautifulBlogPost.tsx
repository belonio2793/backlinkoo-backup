import React from "react";

// --- Types ---
type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "li"; text: string }
  | { type: "link"; text: string; href: string };

interface BlogPostProps {
  content: string;             // raw blog content
  title?: string;              // optional H1
  enableAutoFormat?: boolean;  // new prop (default = false for safety)
  className?: string;          // custom wrapper styles
}

// --- Utility: detect sections, lists, urls ---
const isSectionHeading = (line: string) =>
  /^(\s*)(section|chapter|part)\s+\d+[:.)-]*/i.test(line) ||
  (/^[\p{L}\p{N}\s,'&/()-]{3,90}:$/u.test(line.trim()) &&
    !line.includes("http"));

const isListItem = (line: string) =>
  /^(\s*)(-|•|\d+[.)])\s+/.test(line);

const urlOnly = (line: string) => {
  const m = line.trim().match(/^(https?:\/\/\S+)$/i);
  return m ? m[1] : null;
};

// --- Utility: boldify "Heading: text" ---
const strongify = (text: string): React.ReactNode => {
  const idx = text.indexOf(":");
  if (idx > 0 && idx < 80) {
    const head = text.slice(0, idx).trim();
    const tail = text.slice(idx + 1).trim();
    if (/^[\p{L}\d][\p{L}\d\s'&/()-]*$/u.test(head)) {
      return (
        <>
          <strong>{head}:</strong> {tail}
        </>
      );
    }
  }
  return text;
};

// --- Parse into structured blocks ---
function parseContentToBlocks(raw: string): Block[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: Block[] = [];
  for (const line of lines) {
    const url = urlOnly(line);
    if (url) {
      blocks.push({ type: "link", text: line, href: url });
      continue;
    }
    if (isSectionHeading(line)) {
      blocks.push({
        type: "h2",
        text: line.replace(/\s*[:.]$/, "").trim(),
      });
      continue;
    }
    if (isListItem(line)) {
      const cleaned = line.replace(/^(\s*)(-|•|\d+[.)])\s+/, "");
      blocks.push({ type: "li", text: cleaned });
      continue;
    }
    blocks.push({ type: "p", text: line });
  }
  return blocks;
}

// --- Render structured blocks ---
const renderBlocks = (blocks: Block[]) => {
  const out: JSX.Element[] = [];
  let i = 0;

  while (i < blocks.length) {
    const b = blocks[i];

    // group list items
    if (b.type === "li") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "li") {
        items.push(blocks[i]);
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} className="list-disc list-inside my-4 pl-4">
          {items.map((it, idx) => (
            <li key={`li-${i}-${idx}`}>{strongify(it.text)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // headings
    if (b.type === "h2") {
      out.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold mt-8 mb-3">
          {b.text}
        </h2>
      );
    }
    // links
    else if (b.type === "link") {
      out.push(
        <p key={`a-${i}`} className="my-4">
          <a
            href={b.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-semibold"
          >
            {b.text}
          </a>
        </p>
      );
    }
    // paragraphs
    else {
      out.push(
        <p key={`p-${i}`} className="mb-4 leading-relaxed">
          {strongify(b.text)}
        </p>
      );
    }
    i++;
  }
  return out;
};

// --- Legacy fallback rendering ---
const legacyRender = (content: string) =>
  content
    .split(/\n{2,}/) // break on double newlines
    .map((p, idx) => (
      <p key={`legacy-${idx}`} className="mb-4 leading-relaxed">
        {p.trim()}
      </p>
    ));

// --- Main Component ---
const BeautifulBlogPost: React.FC<BlogPostProps> = ({
  content,
  title,
  enableAutoFormat = false, // default is false → safe rollout
  className = "",
}) => {
  let body: React.ReactNode;

  if (enableAutoFormat) {
    try {
      const blocks = parseContentToBlocks(content);
      body = renderBlocks(blocks);
    } catch (e) {
      console.error("BeautifulBlogPost formatter failed, fallback:", e);
      body = legacyRender(content);
    }
  } else {
    body = legacyRender(content);
  }

  return (
    <article className={`auto-blog ${className}`}>
      {title && <h1 className="text-3xl font-extrabold mb-6">{title}</h1>}
      {body}
    </article>
  );
};

export default BeautifulBlogPost;
