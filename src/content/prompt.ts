export type PromptRole = 'verb' | 'object' | 'plain';

export interface PromptSegment {
  text: string;
  role: PromptRole;
}

/**
 * Parse a prompt line with lightweight role markup into colored segments so the
 * UI can highlight sentence structure ("主谓宾"):
 *
 *   [动作]  -> verb    (the action)
 *   {对象}  -> object  (the thing acted on)
 *   其余     -> plain
 *
 * A line with no markup yields a single plain segment, so un-annotated prompts
 * still render correctly.
 */
export function parsePromptLine(input: string): PromptSegment[] {
  const segments: PromptSegment[] = [];
  const re = /\[([^[\]]+)\]|\{([^{}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ text: input.slice(last, m.index), role: 'plain' });
    }
    if (m[1] !== undefined) {
      segments.push({ text: m[1], role: 'verb' });
    } else if (m[2] !== undefined) {
      segments.push({ text: m[2], role: 'object' });
    }
    last = re.lastIndex;
  }

  if (last < input.length) {
    segments.push({ text: input.slice(last), role: 'plain' });
  }
  return segments;
}
