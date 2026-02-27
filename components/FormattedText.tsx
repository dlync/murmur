import React, { useContext } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

// Fixed palette for the named colour tokens used in the legacy markdown format
const NAMED_COLORS: Record<string, string> = {
  warm: '#C4874A',
  rose: '#C05A5A',
  cool: '#5E7A8A',
  sage: '#68A86A',
};

// ── Shared segment type ────────────────────────────────────────────────────

interface Seg {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;      // direct hex / rgb value (HTML format)
  colorName?: string;  // named token (legacy markdown format)
}

// ── HTML parser ────────────────────────────────────────────────────────────
// Handles output from RichTextEditor (contentEditable + execCommand).
// Supported tags: <b>, <strong>, <i>, <em>, <span style="color:...">,
//                 <font color="...">, <br>, <div>, <p>, text nodes.

function parseHtml(html: string): Seg[] {
  const segs: Seg[] = [];

  // Normalise block elements → newlines
  const norm = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n').replace(/<div[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n').replace(/<p[^>]*>/gi, '');

  type St = { bold: boolean; italic: boolean; color?: string };
  const stack: St[] = [];
  let cur: St = { bold: false, italic: false };

  const TOK = /(<(\/?)(\w+)([^>]*)>)|([^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = TOK.exec(norm)) !== null) {
    if (m[5] !== undefined) {
      // text node — decode common HTML entities
      const text = m[5]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      if (text) segs.push({ text, ...cur });
    } else {
      const closing = m[2] === '/';
      const tag = m[3].toLowerCase();
      const attrs = m[4] || '';

      if (!closing) {
        stack.push({ ...cur });
        if (tag === 'b' || tag === 'strong') {
          cur = { ...cur, bold: true };
        } else if (tag === 'i' || tag === 'em') {
          cur = { ...cur, italic: true };
        } else if (tag === 'span') {
          const cm = attrs.match(/color\s*:\s*([^;"']+)/i);
          if (cm) cur = { ...cur, color: cm[1].trim() };
        } else if (tag === 'font') {
          const cm = attrs.match(/color=["']?([^"'\s>]+)/i);
          if (cm) cur = { ...cur, color: cm[1] };
        }
      } else {
        if (stack.length > 0) cur = stack.pop()!;
      }
    }
  }

  return segs;
}

// ── Legacy markdown parser ─────────────────────────────────────────────────
// Handles the {c:name}text{/c} / **bold** / _italic_ syntax stored
// by the old plain-text editor (before the WebView editor was introduced).

function parseMarkdown(raw: string): Seg[] {
  const segs: Seg[] = [];
  const RE = /\*\*([\s\S]+?)\*\*|_([\s\S]+?)_|\{c:([^}]+)\}([\s\S]+?)\{\/c\}/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = RE.exec(raw)) !== null) {
    if (m.index > last) segs.push({ text: raw.slice(last, m.index) });
    if      (m[1] != null) segs.push({ text: m[1], bold: true });
    else if (m[2] != null) segs.push({ text: m[2], italic: true });
    else if (m[3] != null) segs.push({ text: m[4], colorName: m[3] });
    last = m.index + m[0].length;
  }

  if (last < raw.length) segs.push({ text: raw.slice(last) });
  return segs;
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const HTML_TAG = /<[a-z][^>]*>/i;

export function FormattedText({ text, style, numberOfLines }: Props) {
  const { colors } = useContext(ThemeContext);
  const segs = HTML_TAG.test(text) ? parseHtml(text) : parseMarkdown(text);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segs.map((seg, i) => {
        const s: TextStyle = {};
        if (seg.bold)      s.fontWeight = '700';
        if (seg.italic)    s.fontStyle  = 'italic';
        if (seg.color)     s.color = seg.color;
        if (seg.colorName) s.color = seg.colorName === 'accent'
          ? colors.accent
          : (NAMED_COLORS[seg.colorName] ?? seg.colorName);

        return Object.keys(s).length > 0
          ? <Text key={i} style={s}>{seg.text}</Text>
          : <React.Fragment key={i}>{seg.text}</React.Fragment>;
      })}
    </Text>
  );
}

// Exported for reference (used to render colour swatches elsewhere)
export const FORMAT_COLORS: { name: string; hex: string }[] = [
  { name: 'warm', hex: '#C4874A' },
  { name: 'rose', hex: '#C05A5A' },
  { name: 'cool', hex: '#5E7A8A' },
  { name: 'sage', hex: '#68A86A' },
];
