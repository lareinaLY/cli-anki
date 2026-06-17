import { decks } from './content/loader';
import { StudyView } from './ui/StudyView';
import { useStudy } from './ui/useStudy';

export function App() {
  // MVP ships the git deck; a deck picker comes when bash is added.
  const deck = decks[0];
  const study = useStudy(deck);

  return (
    <main className="app">
      <header className="topbar">
        <h1 className="brand">
          cli<span className="brand-dim">-anki</span>
        </h1>
        <div className="deck-name">{study.deckTitle}</div>
        <div className="counts">
          {study.status === 'studying' && (
            <>
              <span className="pill pill-due">待复习 {study.dueCount}</span>
              <span className="pill pill-new">新卡 {study.newCount}</span>
              <span className="pill">剩余 {study.remaining}</span>
            </>
          )}
        </div>
      </header>

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

      <footer className="footer">
        用背单词的方式学命令行 · 进度仅保存在本机浏览器
      </footer>
    </main>
  );
}
