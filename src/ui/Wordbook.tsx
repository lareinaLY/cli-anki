import type { Mastery, WordbookGroup } from '../study/wordbook';
import { formatDue } from './format';

const LABELS: Record<Mastery, { name: string; icon: string }> = {
  new: { name: '未学', icon: '🆕' },
  learning: { name: '学习中', icon: '📖' },
  young: { name: '巩固中', icon: '🌱' },
  mature: { name: '已掌握', icon: '✅' },
};

const stripMarkup = (s: string) => s.replace(/[[\]{}]/g, '');

export function Wordbook({ groups }: { groups: WordbookGroup[] }) {
  const total = groups.reduce((n, g) => n + g.entries.length, 0);
  const now = new Date();

  return (
    <div className="wordbook">
      <div className="wb-summary">
        <span className="wb-total">共 {total} 个命令</span>
        {groups.map((g) => (
          <span key={g.mastery} className={`wb-pill wb-${g.mastery}`}>
            {LABELS[g.mastery].icon} {LABELS[g.mastery].name} {g.entries.length}
          </span>
        ))}
      </div>

      {groups
        .filter((g) => g.entries.length > 0)
        .map((g) => (
          <section key={g.mastery} className="wb-group">
            <h3 className={`wb-group-title wb-${g.mastery}`}>
              {LABELS[g.mastery].icon} {LABELS[g.mastery].name}
              <span className="wb-count">{g.entries.length}</span>
            </h3>
            <div className="wb-items">
              {g.entries.map((e) => (
                <div key={e.card.id} className="wb-item">
                  <code className="wb-cmd">{e.card.answer}</code>
                  <span className="wb-prompt">{stripMarkup(e.card.prompt)}</span>
                  {e.difficulty !== null && (
                    <span className="wb-diff" title="FSRS 难度（越高越难记）">
                      难度 {e.difficulty.toFixed(1)}
                    </span>
                  )}
                  {e.due && <span className="wb-due">{formatDue(e.due, now)}后复习</span>}
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
