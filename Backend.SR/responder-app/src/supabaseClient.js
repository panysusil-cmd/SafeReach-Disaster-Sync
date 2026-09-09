import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pihjynkvwwrgvbxkyosj.supabase.co";
const SUPABASE_KEY = "sb_publishable_RVBqDu7nugLW7snDQkBjYA_6GPGc8df";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
