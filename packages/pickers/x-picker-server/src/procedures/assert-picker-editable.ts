import 'server-only';

import { EDITABLE_PICKER_STATUS } from '@giveaway/picker-model/schemas/status';
import type { PickerStatus } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

export const assertPickerEditable = (picker: { status: PickerStatus }) => {
  if (!EDITABLE_PICKER_STATUS[picker.status]) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: 'This picker can no longer be edited'
    });
  }
};
