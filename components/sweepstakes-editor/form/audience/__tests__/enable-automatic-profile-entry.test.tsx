import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { nanoid } from 'nanoid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toDefaultValues } from '@/lib/task/defaults';
import { TaskSchema } from '@/lib/task/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { EnableAutomaticProfileEntry } from '../enable-automatic-profile-entry';

vi.mock('nanoid', () => ({ nanoid: vi.fn() }));

const bonusTask: TaskSchema = { ...toDefaultValues('BONUS_TASK'), id: 'bonus' };
const visitTask: TaskSchema = { ...toDefaultValues('VISIT_URL'), id: 'visit' };
const profileTask: TaskSchema = {
  ...toDefaultValues('BONUS_COMPLETE_PROFILE'),
  id: 'profile'
};

const renderToggle = (tasks: TaskSchema[]) =>
  renderWithForm(<EnableAutomaticProfileEntry />, {
    values: buildFormValues({ tasks })
  });

describe('EnableAutomaticProfileEntry', () => {
  beforeEach(() => {
    vi.mocked(nanoid).mockReset().mockReturnValue('new-profile-task');
  });

  it('matches the snapshot', () => {
    const { container } = renderToggle([bonusTask]);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });

  it('is off when there is no profile completion task', () => {
    renderToggle([bonusTask, visitTask]);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('is on when a profile completion task exists', () => {
    renderToggle([bonusTask, profileTask]);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it.fails('labels the switch with the setting name', () => {
    renderToggle([bonusTask]);
    expect(
      screen.getByRole('switch', { name: 'Reward Profile Completion' })
    ).toBeInTheDocument();
  });

  it('is off when the tasks are missing', () => {
    renderWithForm(<EnableAutomaticProfileEntry />, {
      values: {
        ...buildFormValues(),
        tasks: undefined as unknown as TaskSchema[]
      }
    });
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  describe('when turned on', () => {
    it('adds a profile completion task before the other tasks', async () => {
      const { form } = renderToggle([bonusTask, visitTask]);
      await userEvent.click(screen.getByRole('switch'));

      expect(form.getValues('tasks')).toEqual([
        {
          ...toDefaultValues('BONUS_COMPLETE_PROFILE'),
          id: 'new-profile-task'
        },
        bonusTask,
        visitTask
      ]);
      expect(screen.getByRole('switch')).toBeChecked();
    });
  });

  describe('when turned off', () => {
    it('removes every profile completion task and keeps the others in order', async () => {
      const { form } = renderToggle([
        profileTask,
        bonusTask,
        { ...profileTask, id: 'profile-2' },
        visitTask
      ]);
      await userEvent.click(screen.getByRole('switch'));

      expect(form.getValues('tasks')).toEqual([bonusTask, visitTask]);
      expect(screen.getByRole('switch')).not.toBeChecked();
      expect(nanoid).not.toHaveBeenCalled();
    });
  });

  it('explains the reward in the help dialog', async () => {
    const { container } = renderToggle([]);
    const help = container.querySelector('[aria-haspopup="dialog"]');
    if (!help) throw new Error('Help trigger not found');
    await userEvent.click(help);

    expect(
      screen.getByRole('dialog', { name: 'Help: Reward Profile Completion' })
    ).toHaveTextContent(
      'cannot be manually edited or removed while this setting is enabled'
    );
  });
});
