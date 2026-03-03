import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptIfPossible, verifyWebhookSignature } from '@/lib/crypto';

function resolveExpiry(data: any): Date | null {
  if (data.expires_at) {
    const dt = new Date(data.expires_at);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  if (data.expires_in) {
    return new Date(Date.now() + Number(data.expires_in) * 1000);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-salla-signature') || request.headers.get('x-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event || payload.type;
  if (event !== 'app.store.authorize' && event !== 'authorization' && event !== 'app.installed') {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data ?? payload;
  const storeId = String(data.store_id ?? data.merchant?.id ?? '');
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;

  if (!storeId || !accessToken) {
    return NextResponse.json({ error: 'Missing token payload' }, { status: 400 });
  }

  await prisma.store.upsert({
    where: { id: storeId },
    create: {
      id: storeId,
      accessToken: encryptIfPossible(accessToken),
      refreshToken: encryptIfPossible(refreshToken ?? ''),
      tokenExpiresAt: resolveExpiry(data)
    },
    update: {
      accessToken: encryptIfPossible(accessToken),
      refreshToken: encryptIfPossible(refreshToken ?? ''),
      tokenExpiresAt: resolveExpiry(data)
    }
  });

  return NextResponse.json({ ok: true });
}
