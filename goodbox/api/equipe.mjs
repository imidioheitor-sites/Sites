/* Aba de equipe do GOODBOX: função da Vercel + Vercel Blob (kit HELU, ver factory/coder/padrao-sites.md) */
import { criarApiEquipe } from './_equipe/equipe-api.mjs';
import { armazemVercelBlob, fotosVercelBlob, diagnostico } from './_equipe/armazem-vercel-blob.mjs';

let api;
async function tratar(request) {
  if (new URL(request.url).searchParams.get('diag') === '1') {
    return new Response(JSON.stringify(await diagnostico(armazemVercelBlob({ pasta: 'diag' }))),
      { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  if (!api) api = criarApiEquipe({ armazem: armazemVercelBlob(), fotos: fotosVercelBlob() });
  return api(request);
}
export const GET = tratar;
export const POST = tratar;
export const PUT = tratar;
export const config = { maxDuration: 30 };
