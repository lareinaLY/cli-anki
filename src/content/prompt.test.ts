import { describe, expect, it } from 'vitest';
import { parsePromptLine } from './prompt';

describe('parsePromptLine', () => {
  it('returns a single plain segment when there is no markup', () => {
    expect(parsePromptLine('查看当前状态')).toEqual([{ text: '查看当前状态', role: 'plain' }]);
  });

  it('parses verb and object markup with surrounding plain text', () => {
    expect(parsePromptLine('[撤销]最近一次 {commit}')).toEqual([
      { text: '撤销', role: 'verb' },
      { text: '最近一次 ', role: 'plain' },
      { text: 'commit', role: 'object' },
    ]);
  });

  it('handles plain text before the first marker', () => {
    expect(parsePromptLine('在当前目录[初始化]一个新的 {Git 仓库}')).toEqual([
      { text: '在当前目录', role: 'plain' },
      { text: '初始化', role: 'verb' },
      { text: '一个新的 ', role: 'plain' },
      { text: 'Git 仓库', role: 'object' },
    ]);
  });

  it('preserves order for 把-style sentences', () => {
    expect(parsePromptLine('把{当前目录所有改动}[加入]暂存区')).toEqual([
      { text: '把', role: 'plain' },
      { text: '当前目录所有改动', role: 'object' },
      { text: '加入', role: 'verb' },
      { text: '暂存区', role: 'plain' },
    ]);
  });
});
