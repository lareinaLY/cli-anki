import { useEffect, useMemo, useState } from 'react';
import { decks } from '../content/loader';
import type { Card, Deck } from '../content/types';
import { getAllUserCards } from '../store/db';
import { StudyView } from './StudyView';
import { Wordbook } from './Wordbook';
import { useStudy } from './useStudy';
import { buildWordbook } from '../study/wordbook';
import { AiPanel } from './AiPanel';

const USER_DECK_ID = 'user';

/** 单卡复习 mode: pick a deck (git / shell / 生词本) and review it via SRS. */
export function StudyMode() {
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string>(decks[0].id);
  const [view, setView] = useState<'review' | 'wordbook'>('review');

  useEffect(() => {
    let cancelled = false;
    void getAllUserCards().then((c) => {
      if (!cancelled) setUserCards(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Bundled decks plus a virtual "生词本" deck backed by the user's cards.
  const choices = useMemo<Deck[]>(
    () => [...decks, { id: USER_DECK_ID, title: '生词本', cards: userCards }],
    [userCards],
  );
  const deck = choices.find((d) => d.id === selectedId) ?? choices[0];

  const study = useStudy(deck);

  return (
    <>
      <section className="mode-col">
        <div className="counts-row">
          <select
            className="deck-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {choices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id === USER_DECK_ID ? `生词本（${userCards.length}）` : d.title}
              </option>
            ))}
          </select>

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
                <p>
                  {deck.id === USER_DECK_ID
                    ? '生词本还是空的，去「生词本」tab 粘贴命令生成卡片吧。'
                    : '这个卡组还没有卡片。'}
                </p>
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
