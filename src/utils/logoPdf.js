/**
 * Load a remote logo for @react-pdf/renderer <Image src="...">.
 * Direct fetch() to Supabase Storage often fails from the browser (CORP /
 * CORS / redirects). We proxy via /api/image-proxy first, then fall back.
 */
export async function logoUrlToDataUri(logoUrl) {
  const url = String(logoUrl || '').trim();
  if (!url) return '';

  const toDataUri = async (res) => {
    if (!res.ok) return '';
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    const ct = (res.headers.get('content-type') || 'image/png').split(';')[0].trim();
    if (!/^image\//i.test(ct)) return '';
    return `data:${ct};base64,${b64}`;
  };

  try {
    const proxied = `/api/image-proxy?u=${encodeURIComponent(url)}`;
    const r = await fetch(proxied, { cache: 'no-store' });
    const asData = await toDataUri(r);
    if (asData) return asData;
  } catch { /* fall through */ }

  try {
    const r2 = await fetch(url, { cache: 'no-store', mode: 'cors' });
    return await toDataUri(r2);
  } catch {
    return '';
  }
}
