/**
 * Parses WordPress post content.rendered HTML into structured fields.
 * Handles Key Verse, Message, Thought for the day (and variants like Quote/Challenge, Prayer for today).
 */

export interface ParsedDevotionalContent {
  keyVerseText: string;
  keyVerseRef: string;
  message: string;
  thoughtForDay: string;
  audioUrl?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirstParagraphAfterHeading(html: string, headingText: string): string {
  const lower = html.toLowerCase();
  const headingLower = headingText.toLowerCase();
  const idx = lower.indexOf(headingLower);
  if (idx === -1) return '';
  const after = html.slice(idx);
  const pMatch = after.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (pMatch) return stripHtml(pMatch[1]);
  const blockquoteMatch = after.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
  if (blockquoteMatch) return stripHtml(blockquoteMatch[1]);
  return '';
}

function extractKeyVerseAndRef(html: string): { text: string; ref: string } {
  const keyVerseHeading = html.match(/Key Verse<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (keyVerseHeading) {
    const inner = keyVerseHeading[1];
    const text = stripHtml(inner);
    const citeMatch = html.match(/<cite[^>]*>[\s\S]*?Text\s*[—\-]\s*([^<]+)/i) ?? html.match(/TEXT\s*[—\-]\s*([^<\s]+(?:\s*[^<]+)?)/i);
    const ref = citeMatch ? stripHtml(citeMatch[1]) : '';
    return { text, ref };
  }
  return { text: '', ref: '' };
}

function extractMessage(html: string): string {
  const sections = ['Message</h2>', 'Message</span>', '<p><strong>Message</strong></p>'];
  for (const marker of sections) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;
    const after = html.slice(idx + marker.length);
    const endMarkers = ['Thought for the day', 'Quote', 'Challenge', 'Prayer for today', 'Further Reading', '<span style="font-size: 48px'];
    let end = after.length;
    for (const em of endMarkers) {
      const ei = after.toLowerCase().indexOf(em.toLowerCase());
      if (ei !== -1 && ei < end) end = ei;
    }
    const block = after.slice(0, end);
    const paragraphs = block.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (paragraphs) {
      return paragraphs.map((p) => stripHtml(p.replace(/<[^>]+>/g, ' '))).filter(Boolean).join('\n\n');
    }
  }
  return '';
}

function extractThoughtForDay(html: string): string {
  const markers = [
    /Thought for the day<\/span>[\s\S]*?<blockquote[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
    /Thought for the day[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
    /<blockquote[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>\s*<\/blockquote>/i,
  ];
  for (const re of markers) {
    const m = html.match(re);
    if (m && m[1]) return stripHtml(m[1]);
  }
  const quoteBlock = html.match(/Quote<\/strong>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (quoteBlock) return stripHtml(quoteBlock[1]);
  return '';
}

function extractAudioUrl(html: string): string | undefined {
  // <audio src="..."> or <source src="...">
  const audioSrc = html.match(/<audio[^>]+src=["']([^"']+)["']/i)?.[1] ?? html.match(/<source[^>]+src=["']([^"']+)["']/i)?.[1];
  if (audioSrc) return audioSrc;
  // Link to audio file (extension in URL)
  const linkMatch = html.match(/href=["']([^"']+\.(?:mp3|m4a|aac|ogg|wav))(\?[^"']*)?["']/i);
  if (linkMatch) return linkMatch[1];
  // WordPress / wp-content uploads often host audio
  const uploadsMatch = html.match(/href=["']([^"']+(?:wp-content\/uploads[^"']*\.(?:mp3|m4a|aac)))[^"']*["']/i);
  if (uploadsMatch) return uploadsMatch[1];
  return undefined;
}

export function parseDevotionalContent(html: string): ParsedDevotionalContent {
  const { text: keyVerseText, ref: keyVerseRef } = extractKeyVerseAndRef(html);
  return {
    keyVerseText,
    keyVerseRef,
    message: extractMessage(html),
    thoughtForDay: extractThoughtForDay(html),
    audioUrl: extractAudioUrl(html),
  };
}
