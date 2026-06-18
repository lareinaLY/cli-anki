import Markdown from 'react-markdown';

/**
 * Renders a card explanation written in Markdown. Authors use `**bold**` to
 * highlight key terms, `` `code` `` for commands/flags, and `-` lists / `>`
 * callouts for structure. Raw HTML is not allowed (react-markdown default),
 * so explanations stay safe and consistent.
 */
export function Explanation({ children }: { children: string }) {
  return (
    <div className="explanation">
      <Markdown>{children}</Markdown>
    </div>
  );
}
