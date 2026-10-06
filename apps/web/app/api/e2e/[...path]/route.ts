import { handleE2eRequest } from '@giveaway/e2e-server/router';

type Context = { params: Promise<{ path: string[] }> };

const handle = async (request: Request, { params }: Context) =>
  handleE2eRequest(request, (await params).path);

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
