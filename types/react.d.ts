import React from 'react';

declare module 'react' {
  export type PC<P = {}> = (
    props: P & { children: React.ReactNode | React.ReactNode[] }
  ) => React.ReactElement | null | Promise<React.ReactElement | null>;
}
