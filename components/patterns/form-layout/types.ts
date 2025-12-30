export type FormLayoutProps = {
  form: React.ReactNode;
  preview: React.ReactNode;
  previewFooter: React.ReactNode;
  hideTabs?: boolean;
};

// TODO: type field prefixes correctly.
export type FieldKey = string;

export type UnifiedFormAction = 'create' | 'edit' | 'demo' | 'view';
export type UniformFormType = 'sweepstake' | 'picker' | 'template';

export type BannerConfig = {
  title: string;
  fullMessage: string;
  shortMessage: string;
  showAction?: boolean;
  actionText?: string;
  actionHref?: string;
};
