import { auth } from './auth';
import { UnauthorizedAccessError } from './errors';

type InjectedContext = { userId: string };

export namespace action {
  export const secure = <Payload, Result>(
    fn: (context: InjectedContext, payload: Payload) => Promise<Result>
  ): ((payload: Payload) => Promise<Result>) => {
    return async (payload: Payload) => {
      const session = await auth();
      const userId = session?.user?.id;

      if (!userId) {
        throw new UnauthorizedAccessError('User not authenticated');
      }

      return fn({ userId }, payload);
    };
  };
}
