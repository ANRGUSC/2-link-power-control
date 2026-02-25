declare module 'react-katex' {
  import type { ComponentType } from 'react';
  interface KatexProps {
    math?: string;
    children?: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: object;
  }
  export const InlineMath: ComponentType<KatexProps>;
  export const BlockMath: ComponentType<KatexProps>;
}
