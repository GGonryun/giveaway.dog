export type TeamPageProps = { slug: string };
export type SweepstakesPageProps = { id: string } & TeamPageProps;
export type PickerPageProps = { pickerId: string } & TeamPageProps;
export type TemplatePageProps = { templateId: string } & TeamPageProps;
