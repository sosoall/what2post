export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/api/waitlist') {
      return handleWaitlist(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

async function handleWaitlist(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }

  // Insert into Supabase
  const { data, error } = await supabaseRequest(env, '/rest/v1/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify({
      email,
      source: body.source || 'waitlist',
    }),
  });

  if (error) {
    if (error.code === '23505') {
      return json({ ok: true, duplicate: true, message: 'Already on the list' });
    }
    console.error('Supabase error:', error);
    return json({ error: 'Database error' }, 500);
  }

  // Send welcome email (fire and forget — don't block the response)
  sendWelcomeEmail(env, email).catch(err => {
    console.error('Email send failed:', err);
  });

  return json({ ok: true, duplicate: false });
}

async function sendWelcomeEmail(env, to) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to,
      subject: "You're in! Welcome to What2post",
      html: welcomeEmailHtml(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${err}`);
  }
}

function welcomeEmailHtml() {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:monospace;background:#f5f0e8;padding:2rem;max-width:520px;margin:0 auto;color:#1a1a1a;">
  <h1 style="font-size:1.4rem;margin-bottom:1rem;">You're on the What2post early bird list! 🎩</h1>
  <p style="line-height:1.7;font-size:0.95rem;">
    Thanks for signing up. You'll be the first to know when we launch.
  </p>
  <p style="line-height:1.7;font-size:0.95rem;">
    Here's what you've locked in:
  </p>
  <ul style="line-height:2;font-size:0.95rem;">
    <li>✦ 1 month free when we launch</li>
    <li>✦ Locked-in founder pricing — forever</li>
    <li>✦ Weekly building updates + insights</li>
  </ul>
  <p style="line-height:1.7;font-size:0.95rem;margin-top:1.5rem;">
    We're building something to solve your daily "what should I post?" struggle — stay tuned.
  </p>
  <p style="margin-top:2rem;font-size:0.8rem;color:#666;">
    — The What2post team
  </p>
</body>
</html>`;
}

async function supabaseRequest(env, path, options = {}) {
  const url = `${env.SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return { data: null, error: data };
  }

  return { data, error: null };
}
