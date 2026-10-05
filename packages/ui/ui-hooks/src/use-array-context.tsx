import React from 'react';

export type ArrayContextValue = number;

export const ArrayContext = React.createContext<ArrayContextValue>(
  -1 as ArrayContextValue
);

export const useArrayContext = () => {
  const context = React.useContext(ArrayContext);
  if (context == null) {
    throw new Error(
      'useArrayContext must be used within a ArrayContext.Provider'
    );
  }
  return context;
};
