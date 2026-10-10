import 'server-only';

import { isE2eGateOpen } from '@giveaway/e2e-gate/gate';
import {
  E2eFakeService,
  parseE2eFakeServices
} from '@giveaway/e2e-model/fakes';

export const getE2eFakeServices = (): E2eFakeService[] =>
  isE2eGateOpen() ? parseE2eFakeServices(process.env.E2E_FAKE_EXTERNALS) : [];

export const isE2eFakeOn = (service: E2eFakeService) =>
  getE2eFakeServices().includes(service);
