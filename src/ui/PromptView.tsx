import { parsePromptLine } from '../content/prompt';

function Segments({ line }: { line: string }) {
  return (
    <>
      {parsePromptLine(line).map((seg, i) => (
        <span key={i} className={`role-${seg.role}`}>
          {seg.text}
        </span>
      ))}
    </>
  );
}

/**
 * Renders the task line with role-based highlighting (verb / object) and an
 * optional dimmed "约束条件" line beneath it.
 */
export function PromptView({
  prompt,
  constraint,
}: {
  prompt: string;
  constraint?: string | undefined;
}) {
  return (
    <div className="prompt">
      <p className="prompt-main">
        <Segments line={prompt} />
      </p>
      {constraint && (
        <p className="prompt-constraint">
          <span className="constraint-tag">条件</span>
          <span>
            <Segments line={constraint} />
          </span>
        </p>
      )}
    </div>
  );
}
