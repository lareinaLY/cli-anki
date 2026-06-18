import { useState } from 'react';
import { StudyMode } from './ui/StudyMode';
import { ScenarioMode } from './ui/ScenarioMode';

type Mode = 'study' | 'scenarios';

export function App() {
  const [mode, setMode] = useState<Mode>('study');

  return (
    <main className="app">
      <header className="topbar">
        <h1 className="brand">
          cli<span className="brand-dim">-anki</span>
        </h1>
        <nav className="tabs">
          <button
            className={`tab ${mode === 'study' ? 'tab-on' : ''}`}
            onClick={() => setMode('study')}
          >
            单卡复习
          </button>
          <button
            className={`tab ${mode === 'scenarios' ? 'tab-on' : ''}`}
            onClick={() => setMode('scenarios')}
          >
            场景练习
          </button>
        </nav>
      </header>

      <div className="workspace">{mode === 'study' ? <StudyMode /> : <ScenarioMode />}</div>

      <footer className="footer">用背单词的方式学命令行 · 进度仅保存在本机浏览器</footer>
    </main>
  );
}
