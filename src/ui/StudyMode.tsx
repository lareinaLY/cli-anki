import { useState } from 'react';
import { decks } from '../content/loader';
import { StudyView } from './StudyView';
import { Wordbook } from './Wordbook';
import { useStudy } from './useStudy';
import { buildWordbook } from '../study/wordbook';
import { AiPanel } from './AiPanel';

/** 单卡复习 mode: SRS-scheduled flashcards from the git deck. */
export function StudyMode() {
  // MVP ships the git deck; a deck picker comes when bash is added.
  const deck = decks[0];
  const study = useStudy(deck);
  const [view, setView] = useState<'review' | 'wordbook'>('review');

  return (
    <>
      <section className="mode-col">
        <div className="counts-row">
          <span className="deck-name">{study.deckTitle}</span>
          <div className="subtabs">
            <button
              className={`subtab ${view === 'review' ? 'subtab-on' : ''}`}
              onClick={() => setView('review')}
            >
              复习
            </button>
            <button
              className={`subtab ${view === 'wordbook' ? 'subtab-on' : ''}`}
              onClick={() => setView('wordbook')}
            >
              单词本
            </button>
          </div>
          {view === 'review' && study.status === 'studying' && (
            <>
              <span className="pill pill-due">待复习 {study.dueCount}</span>
              <span className="pill pill-new">新卡 {study.newCount}</span>
              <span className="pill">剩余 {study.remaining}</span>
            </>
          )}
        </div>

        {view === 'wordbook' ? (
          <Wordbook groups={buildWordbook(deck.cards, study.progress)} />
        ) : (
          <div className="stage">
          {study.status === 'loading' && <p className="hint">加载进度…</p>}

          {study.status === 'empty' && (
            <div className="empty">
              <p>这个卡组还没有卡片。</p>
            </div>
          )}

          {study.status === 'studying' && study.current && (
            <StudyView
              key={study.current.id}
              card={study.current}
              phase={study.phase}
              result={study.result}
              intervals={study.intervals}
              onSubmit={study.submit}
              onGrade={study.grade}
            />
          )}

          {study.status === 'done' && (
            <div className="done">
              <p className="done-emoji">🎉</p>
              <p>本轮复习完成！</p>
              <div className="done-actions">
                <button className="submit" onClick={study.restart}>
                  再来一轮
                </button>
                <button
                  className="ghost"
                  onClick={() => {
                    if (confirm('确定要清空所有学习进度吗？此操作不可撤销。')) void study.reset();
                  }}
                >
                  重置进度
                </button>
              </div>
            </div>
          )}
          </div>
        )}
      </section>

      <AiPanel card={study.current} />
    </>
  );
}
