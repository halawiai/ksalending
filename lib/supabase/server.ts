import { cookies } from 'next/headers';
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

export const getServerClient = () =>
  createServerComponentClient<Database>({ cookies });

export const getRouteClient = () =>
  createRouteHandlerClient<Database>({ cookies });