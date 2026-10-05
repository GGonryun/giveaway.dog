import 'server-only';

import { NextResponse } from 'next/server';

export const handlePingCommand = () => {
  return NextResponse.json({ type: 1 });
};
