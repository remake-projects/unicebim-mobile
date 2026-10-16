// Deletes the calling user's account: avatar files in Storage, then the auth user.
// Database rows go with it through ON DELETE CASCADE (profiles → wallets, transactions, …).
//
// Called by the app with the user's access token:
//   supabase.functions.invoke('delete-account', { method: 'POST' })
import { createClient } from 'npm:@supabase/supabase-js@2';

const AVATAR_BUCKET = 'avatars';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: 'unauthorized' }, 401);
  const userId = data.user.id;

  const { data: files, error: listError } = await admin.storage.from(AVATAR_BUCKET).list(userId, { limit: 1000 });
  if (listError) return fail('storage_list_failed', listError);
  if (files.length > 0) {
    const { error: removeError } = await admin.storage
      .from(AVATAR_BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
    if (removeError) return fail('storage_remove_failed', removeError);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) return fail('delete_failed', deleteError);

  return json({ ok: true }, 200);
});

/** The cause goes to the function logs only; the app gets a stable code. */
function fail(code: string, cause: { message: string }): Response {
  console.error(code, cause.message);
  return json({ error: code }, 500);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
