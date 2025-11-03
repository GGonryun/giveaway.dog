import { cn } from '@/lib/utils';
import {
  PickerActionType,
  PICKER_ACTION_TYPE_LABEL,
  PICKER_ACTION_TYPE_ICON
} from '../schemas/form';

const SIZE_MAP: Record<'sm' | 'md', number> = {
  sm: 2,
  md: 4
};

const GAP_MAP: Record<'sm' | 'md', number> = {
  sm: 1,
  md: 2
};

export const PickerActionDisplay: React.FC<{
  action: PickerActionType;
  size?: 'sm' | 'md';
}> = ({ action, size = 'md' }) => {
  const label = PICKER_ACTION_TYPE_LABEL[action];
  const Icon = PICKER_ACTION_TYPE_ICON[action];
  const s = SIZE_MAP[size];
  const gap = GAP_MAP[size];
  return (
    <>
      <Icon className={cn(`h-${s} w-${s} mr-${gap}`)} />
      {label}
    </>
  );
};
