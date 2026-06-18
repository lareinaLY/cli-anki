import { useCallback, useRef, useState } from 'react';
import type { Card } from '../content/types';
import type { AiConfig } from '../ai/config';
import { askAI, buildMessages, type ChatMessage } from '../ai/client';

export interface AiChatApi {
  /** Visible transcript (user + assistant turns; the system prompt is hidden). */
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  send: (question: string) => void;
  clear: () => void;
}

/**
 * Conversation state for the Q&A panel. The current card is injected into the
 * system prompt on every request, so the assistant always knows what the user
 * is looking at. History persists across cards; `clear` resets it.
 */
export function useAiChat(card: Card | null, config: AiConfig | null): AiChatApi {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!config || !q || loading) return;

      const history = messages;
      setMessages((m) => [...m, { role: 'user', content: q }]);
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      askAI(config, buildMessages(card, history, q), { signal: controller.signal })
        .then((reply) => {
          setMessages((m) => [...m, { role: 'assistant', content: reply }]);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : String(e));
        })
        .finally(() => {
          setLoading(false);
          abortRef.current = null;
        });
    },
    [config, card, messages, loading],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setLoading(false);
  }, []);

  return { messages, loading, error, send, clear };
}
