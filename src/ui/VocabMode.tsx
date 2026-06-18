import { useEffect, useState } from 'react';
import type { Card } from '../content/types';
import { getAiConfig } from '../ai/config';
import { generateCard, type GeneratedCard } from '../ai/generate';
import { addUserCard, deleteUserCard, getAllUserCards, type UserCardRecord } from '../store/db';
import { AiPanel } from './AiPanel';
import { PromptView } from './PromptView';
import { Explanation } from './Explanation';

const stripMarkup = (s: string) => s.replace(/[[\]{}]/g, '');

export function VocabMode() {
  const [command, setCommand] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The generated card awaiting save, paired with the exact command it's for.
  const [preview, setPreview] = useState<{ card: GeneratedCard; answer: string } | null>(null);
  const [cards, setCards] = useState<UserCardRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getAllUserCards().then((c) => {
      if (!cancelled) setCards(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = () => {
    const answer = command.trim();
    if (!answer || generating) return;
    const config = getAiConfig();
    if (!config) {
      setError('请先在右侧「问 AI」面板接入 OpenAI（生成讲解需要你的 API Key）。');
      return;
    }
    setGenerating(true);
    setError(null);
    setPreview(null);
    generateCard(answer, config)
      .then((card) => setPreview({ card, answer }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setGenerating(false));
  };

  const save = () => {
    if (!preview) return;
    const { card, answer } = preview;
    void addUserCard({
      prompt: card.prompt,
      ...(card.constraint ? { constraint: card.constraint } : {}),
      answer,
      ...(card.accept ? { accept: card.accept } : {}),
      explanation: card.explanation,
      ...(card.tags ? { tags: card.tags } : {}),
    }).then((saved) => {
      setCards((cs) => [saved, ...cs]);
      setPreview(null);
      setCommand('');
    });
  };

  const remove = (id: string) => {
    void deleteUserCard(id).then(() => setCards((cs) => cs.filter((c) => c.id !== id)));
  };

  // Context for the AI panel: the card being previewed, if any.
  const contextCard: Card | null = preview
    ? { id: 'preview', answer: preview.answer, ...preview.card }
    : null;

  return (
    <>
      <section className="mode-col vocab">
        <h2 className="list-title">生词本</h2>
        <p className="list-sub">
          粘贴任意命令，AI 生成和预制课同款讲解；满意就加入生词本，按同样的记忆机制复习。
        </p>

        <div className="vocab-add">
          <textarea
            className="vocab-input"
            rows={2}
            value={command}
            spellCheck={false}
            placeholder="粘贴一条命令，例如：git rebase -i HEAD~3"
            onChange={(e) => setCommand(e.target.value)}
          />
          <button className="submit" disabled={generating || !command.trim()} onClick={generate}>
            {generating ? '生成中…' : '生成讲解'}
          </button>
        </div>

        {error && <div className="ai-error">{error}</div>}

        {preview && (
          <div className="vocab-preview">
            <PromptView
              prompt={preview.card.prompt}
              {...(preview.card.constraint ? { constraint: preview.card.constraint } : {})}
            />
            <div className="terminal ok">
              <span className="dollar">$</span>
              <span className="cmd-echo">{preview.answer}</span>
            </div>
            <Explanation>{preview.card.explanation}</Explanation>
            <div className="step-actions">
              <button className="submit" onClick={save}>
                加入生词本
              </button>
              <button className="ghost" onClick={() => setPreview(null)}>
                丢弃
              </button>
            </div>
          </div>
        )}

        <div className="vocab-list">
          <h3 className="vocab-list-title">已收录 {cards.length} 条</h3>
          {cards.length === 0 ? (
            <p className="hint">还没有收录的命令。</p>
          ) : (
            cards.map((c) => (
              <div key={c.id} className="vocab-item">
                <code className="vocab-cmd">{c.answer}</code>
                <span className="vocab-desc">{stripMarkup(c.prompt)}</span>
                <button className="icon-btn" title="删除" onClick={() => remove(c.id)}>
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <AiPanel card={contextCard} />
    </>
  );
}
