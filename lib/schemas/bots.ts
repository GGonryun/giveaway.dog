import z from 'zod';

export const createBotSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  signingSecret: z.string().min(1)
});

export const createBotSchemaDefaults: CreateBotSchema = {
  name: '',
  clientId: '',
  clientSecret: '',
  signingSecret: ''
};

export type CreateBotSchema = z.infer<typeof createBotSchema>;
