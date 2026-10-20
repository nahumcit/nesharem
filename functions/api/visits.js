export async function onRequestGet(context) {
  const mode = new URL(context.request.url).searchParams.get('mode') === 'get' ? 'get' : 'hit';

  try {
    const upstream = await fetch(`https://abacus.jasoncameron.dev/${mode}/nesharem/visits`, {
      headers: {
        accept: 'application/json',
        'user-agent': 'nesharem/1.0 (+https://nesharem.pages.dev)',
      },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ value: null }), {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ value: null }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
