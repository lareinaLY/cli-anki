import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import type { Card } from '../content/types';
import { AI_DEFAULTS, getAiConfig, saveAiConfig, type AiConfig } from '../ai/config';
import { useAiChat } from './useAiChat';

function SettingsForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AiConfig | null;
  onSave: (cfg: AiConfig) => void;
  onCancel: () => void;
}) {
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [baseURL, setBaseURL] = useState(initial?.baseURL ?? '');
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="ai-settings"
      onSubmit={(e) => {
        e.preventDefault();
        if (!apiKey.trim()) {
          setError('请先填入 API Key');
          return;
        }
        onSave({
          apiKey: apiKey.trim(),
          model: model.trim() || AI_DEFAULTS.model,
          baseURL: baseURL.trim() || AI_DEFAULTS.baseURL,
        });
      }}
    >
      <p className="ai-form-intro">填入你的 OpenAI API Key 即可开始向 AI 提问。</p>
      <label>
        OpenAI API Key
        <input
          type="password"
          value={apiKey}
          autoComplete="off"
          placeholder="sk-..."
          onChange={(e) => {
            setApiKey(e.target.value);
            if (error) setError(null);
          }}
        />
      </label>
      <label>
        模型
        <input
          value={model}
          placeholder={AI_DEFAULTS.model}
          onChange={(e) => setModel(e.target.value)}
        />
      </label>
      <label>
        API 地址（兼容 OpenAI 接口可改）
        <input
          value={baseURL}
          placeholder={AI_DEFAULTS.baseURL}
          onChange={(e) => setBaseURL(e.target.value)}
        />
      </label>
      <p className="ai-note">
        Key 只保存在本机浏览器，不会上传或进入代码；请勿在公开部署的站点填入。
      </p>
      {error && <p className="ai-error">{error}</p>}
      <div className="ai-settings-actions">
        <button type="submit" className="submit">
          保存
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

export function AiPanel({ card }: { card: Card | null }) {
  const [config, setConfig] = useState<AiConfig | null>(() => getAiConfig());
  const [editing, setEditing] = useState(false);
  const chat = useAiChat(card, config);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const configured = config !== null;

  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo?.({ top: el.scrollHeight });
  }, [chat.messages, chat.loading]);

  const submit = () => {
    if (!configured) return;
    chat.send(input);
    setInput('');
  };

  return (
    <aside className="ai-panel">
      <header className="ai-head">
        <span className="ai-title">问 AI</span>
        {!editing && (
          <div className="ai-head-actions">
            {configured && (
              <button className="icon-btn" title="清空对话" onClick={chat.clear}>
                清空
              </button>
            )}
            <button className="icon-btn" title="设置" onClick={() => setEditing(true)}>
              设置
            </button>
          </div>
        )}
      </header>

      {editing ? (
        <SettingsForm
          initial={config}
          onSave={(cfg) => {
            saveAiConfig(cfg);
            setConfig(cfg);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="ai-transcript" ref={scrollRef}>
            {!configured ? (
              <div className="ai-onboard">
                <p>用你自己的 OpenAI Key，随时追问当前命令的疑问。</p>
                <button className="submit" onClick={() => setEditing(true)}>
                  接入 OpenAI 开始对话
                </button>
              </div>
            ) : (
              chat.messages.length === 0 &&
              !chat.loading && (
                <p className="ai-empty">
                  对当前命令有疑问？比如“为什么用 <code>--soft</code> 而不是{' '}
                  <code>--mixed</code>”。
                </p>
              )
            )}

            {chat.messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg-${m.role}`}>
                {m.role === 'assistant' ? (
                  <div className="ai-md">
                    <Markdown>{m.content}</Markdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            ))}
            {chat.loading && <div className="ai-msg ai-msg-assistant ai-thinking">思考中…</div>}
            {chat.error && <div className="ai-error">{chat.error}</div>}
          </div>

          <form
            className="ai-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <textarea
              className="ai-input"
              rows={2}
              value={input}
              disabled={!configured}
              placeholder={configured ? '输入问题，回车发送（Shift+回车换行）' : '请先接入 OpenAI'}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Ignore Enter while an IME is composing (e.g. selecting a pinyin candidate).
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="submit"
              className="submit ai-send"
              disabled={!configured || chat.loading || !input.trim()}
            >
              发送
            </button>
          </form>
        </>
      )}
    </aside>
  );
}
