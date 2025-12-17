import { Nil } from '../types';

export const toAuthErrorDescription = (error: Nil<string>) => {
  switch (error) {
    case 'OAuthAccountNotLinked':
      return 'An account with the same email address already exists. Please sign in using a different method.';
    case 'OAuthAccountAlreadyLinked':
      return 'This account is already linked to a different user. Please use a different account or sign in to the account that owns this connection.';
    case 'OAuthCallbackError':
      return 'User canceled the sign-in process or an error occurred during sign-in. Please try again.';
    case 'AccessDenied':
      return 'Access was denied. Please check your permissions and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};
