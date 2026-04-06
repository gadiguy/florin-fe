import { z } from 'zod';

const envSchema = z.object({
  VITE_WALLETCONNECT_PROJECT_ID: z.string().min(1, {
    message: 'VITE_WALLETCONNECT_PROJECT_ID is required',
  }),
  VITE_RPC_URL: z.string().optional().default(''),
  VITE_API_BASE_URL: z.string().min(1, {
    message: 'VITE_API_BASE_URL is required',
  }),
  VITE_EXPIRATION_HOURS: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val > 0, {
      message: 'VITE_EXPIRATION_HOURS must be greater than 0',
    }),
  VITE_MIN_AMOUNT: z.string().transform((val) => Number(val)).refine((val) => val > 0, {
    message: 'VITE_MIN_AMOUNT must be greater than 0',
  }),
  VITE_MAX_AMOUNT: z.string().transform((val) => Number(val)).refine((val) => val > 0, {
    message: 'VITE_MAX_AMOUNT must be greater than 0',
  }),
  VITE_EVM_CONFIRMATIONS: z.string().transform((val) => Number(val)).refine((val) => val > 0, {
    message: 'VITE_EVM_CONFIRMATIONS must be greater than 0',
  }),
  VITE_EVM_CONFIRMATIONS_USD_AMOUNT: z.string().transform((val) => Number(val)).refine((val) => val > 0, {
    message: 'VITE_EVM_CONFIRMATIONS_USD_AMOUNT must be greater than 0',
  }),
  VITE_BTC_CONFIRMATIONS: z.string().transform((val) => Number(val)).refine((val) => val > 0, {
    message: 'VITE_BTC_CONFIRMATIONS must be greater than 0',
  }),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
