/* eslint-disable functional/no-throw-statements */

import { environment } from '@server/environments/environment';
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(environment.supabase.url, environment.supabase.key);
