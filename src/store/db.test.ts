import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { addUserCard, deleteUserCard, getAllUserCards } from './db';

describe('user card store', () => {
  it('adds a card with a generated id, lists newest-first, and deletes', async () => {
    const a = await addUserCard({ prompt: '[查看]{状态}', answer: 'git status', explanation: 'x' });
    expect(a.id).toMatch(/^user-/);
    expect(a.createdAt).toBeTypeOf('number');

    const b = await addUserCard({
      prompt: '交互式[变基]',
      answer: 'git rebase -i HEAD~3',
      explanation: 'y',
    });

    const all = await getAllUserCards();
    const ids = all.map((c) => c.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
    // Newest first: b was added after a.
    expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id));

    await deleteUserCard(a.id);
    const afterDelete = (await getAllUserCards()).map((c) => c.id);
    expect(afterDelete).not.toContain(a.id);
    expect(afterDelete).toContain(b.id);
  });
});
