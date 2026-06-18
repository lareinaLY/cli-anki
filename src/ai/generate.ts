import { z } from 'zod';
import type { AiConfig } from './config';

/**
 * The card fields the model produces for a pasted command. The `answer` is NOT
 * generated — we always use the user's exact pasted command as the answer, so
 * the card is guaranteed self-consistent (it judges its own answer correct).
 */
export const GeneratedCardSchema = z.object({
  prompt: z.string().min(1),
  constraint: z.string().optional(),
  accept: z.array(z.string()).optional(),
  explanation: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

const SYSTEM_PROMPT = `你是一个命令行教学卡片生成器。用户会给你一条命令行，你要为它生成一张学习卡片，风格与精品预制课完全一致。只返回一个 JSON 对象，字段如下：

- "prompt"：一句自然语言的任务描述（用户复习时看到它来回忆命令）。**不要包含命令本身**。用轻量标注高亮句子成分：用方括号包动作/动词，用花括号包关键对象/名词。例如：在当前目录[初始化]一个 {Git 仓库}。
- "constraint"（可选）：附加的约束条件，单独成句，同样用 [] {} 标注。
- "accept"（可选）：与该命令等价的其它写法数组（不含原命令本身），例如长短选项、新旧命令。没有就省略或给空数组。
- "explanation"：Markdown 格式的讲解。正文先拆解每个缩写的全称、解释关键参数的作用、提示常见坑；用行内代码标记命令与参数，用 **加粗** 标重点词，用 - 列表、> 引用块组织结构。**结尾必须包含两个固定小节**：
    - 一个 \`#### 🧠 记忆钩子\` 小节：用一句生动、好记的助记把命令/参数和它的含义联系起来。这一节**必须有**。
    - 如果这条命令或它的参数确有真实的历史、命名由来或八卦，再加一个 \`#### 🕰 冷知识\` 小节。**没有真实故事就不要写这一节，绝不编造。**
- "tags"（可选）：1-3 个主题标签的数组，全小写英文。

务必输出合法 JSON，不要包裹代码块，不要附加多余文字。`;

/** Strip ```json fences if a model wrapped the JSON, then parse. */
function parseLooseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();
  return JSON.parse(raw);
}

export interface GenerateOptions {
  signal?: AbortSignal;
}

/** Ask the model to generate a teaching card for `command`. */
export async function generateCard(
  command: string,
  config: AiConfig,
  opts: GenerateOptions = {},
): Promise<GeneratedCard> {
  const res = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `命令：\n${command.trim()}\n\n请生成这张卡片的 JSON。` },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
    ...(opts.signal ? { signal: opts.signal } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`生成失败（${res.status}）：${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型返回了空内容');

  let parsed: unknown;
  try {
    parsed = parseLooseJson(content);
  } catch {
    throw new Error('模型返回的不是合法 JSON');
  }
  return GeneratedCardSchema.parse(parsed);
}
