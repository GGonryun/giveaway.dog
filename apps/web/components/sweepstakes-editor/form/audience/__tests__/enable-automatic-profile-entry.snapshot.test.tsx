import { nanoid } from 'nanoid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toDefaultValues } from '@/lib/task/defaults';
import { TaskSchema } from '@/lib/task/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';
import { EnableAutomaticProfileEntry } from '../enable-automatic-profile-entry';

vi.mock('nanoid', () => ({ nanoid: vi.fn() }));

const bonusTask: TaskSchema = { ...toDefaultValues('BONUS_TASK'), id: 'bonus' };

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
});
