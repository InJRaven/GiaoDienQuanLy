import { z } from 'zod';

export const getSigninSchema = () => {
  return z.object({
    username: z.string().min(1, { message: 'Please enter your username' }),
    password: z.string().min(1, { message: 'Please enter your password' }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
