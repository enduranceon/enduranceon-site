import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [html, script] = await Promise.all([
  readFile(new URL('pages/calendario.html', root), 'utf8'),
  readFile(new URL('js/calendario-eon-hub.js', root), 'utf8'),
]);
const fail = (message) => { throw new Error(`Contrato do calendário: ${message}`); };
if (!html.includes('src="../js/calendario-eon-hub.js"')) fail('a página não carrega o script do EON Hub');
const projectUrl = script.match(/const SUPABASE_URL\s*=\s*["']([^"']+)["']/)?.[1];
const key = script.match(/const SUPABASE_ANON_KEY\s*=\s*["']([^"']+)["']/)?.[1];
if (!projectUrl || new URL(projectUrl).hostname !== 'qsaowltbnefzpbphhwmr.supabase.co') fail('projeto Supabase incorreto');
if (!key?.startsWith('sb_publishable_')) fail('use uma chave publicável, nunca anon legada ou secret');
if (script.includes('Authorization: `Bearer ${SUPABASE_ANON_KEY}`')) fail('a chave publicável deve ir somente no cabeçalho apikey');

const checks = [
  ['race_series', 'id,name,city,state,country,main_modality,modality,image_url,logo_url,website_url,is_active,active,is_deleted'],
  ['race_event_editions', 'id,series_id,race_series_id,year,is_official,is_public,active,is_deleted,image_url,website_url,city,state,country,name,short_name'],
  ['race_courses', 'id,race_event_edition_id,name,short_label,distance_km,total_distance_km,race_date,modality,is_active,is_deleted'],
  ['coaches', 'id,name,active,show_on_site,role,roles'],
];
for (const [table, columns] of checks) {
  const url = new URL(`/rest/v1/${table}`, projectUrl);
  url.searchParams.set('select', columns);
  url.searchParams.set('limit', '1');
  const response = await fetch(url, { headers: { apikey: key }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) fail(`${table} respondeu HTTP ${response.status}: ${(await response.text()).slice(0, 180)}`);
  if (!Array.isArray(await response.json())) fail(`${table} não retornou uma lista`);
  console.log(`${table}: OK`);
}
