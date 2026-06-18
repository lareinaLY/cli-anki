// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScenarioMode } from './ScenarioMode';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('ScenarioMode', () => {
  it('lists scenarios, runs the first step, and advances on 下一步', async () => {
    const user = userEvent.setup();
    render(<ScenarioMode />);

    // Pick the "new repo" scenario from the list.
    await user.click(screen.getByText('新建仓库并提交第一版'));
    expect(screen.getByText('步骤 1 / 4')).toBeTruthy();

    // Answer step 1 correctly.
    await user.type(screen.getByPlaceholderText('输入命令，回车提交'), 'git init');
    await user.click(screen.getByRole('button', { name: /提交/ }));
    expect(screen.getByText('✓ 正确')).toBeTruthy();

    // Advance to step 2.
    await user.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByText('步骤 2 / 4')).toBeTruthy();
  });

  it('shows the correct answer when the user is wrong, and allows retry', async () => {
    const user = userEvent.setup();
    render(<ScenarioMode />);
    await user.click(screen.getByText('新建仓库并提交第一版'));

    await user.type(screen.getByPlaceholderText('输入命令，回车提交'), 'git wrong');
    await user.click(screen.getByRole('button', { name: /提交/ }));

    expect(screen.getByText('✗ 不对')).toBeTruthy();
    expect(screen.getByText('git init')).toBeTruthy(); // the answer is revealed
    await user.click(screen.getByRole('button', { name: '再试一次' }));
    expect(screen.getByPlaceholderText('输入命令，回车提交')).toBeTruthy();
  });
});
