import { Store } from '@prisma/client';
import { env } from './env';
import { decryptIfPossible, encryptIfPossible } from './crypto';
import { prisma } from './prisma';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProductRecord = {
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
};

async function refreshAccessToken(store: Store): Promise<Store> {
  const refreshToken = decryptIfPossible(store.refreshToken);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.SALLA_CLIENT_ID,
    client_secret: env.SALLA_CLIENT_SECRET
  });

  const response = await fetch(`${env.SALLA_ACCOUNTS_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);
  const data = await response.json();
  const expiresAt = new Date(Date.now() + (Number(data.expires_in) || 3600) * 1000);

  return prisma.store.update({
    where: { id: store.id },
    data: {
      accessToken: encryptIfPossible(data.access_token ?? ''),
      refreshToken: encryptIfPossible(data.refresh_token ?? refreshToken),
      tokenExpiresAt: expiresAt
    }
  });
}

async function ensureValidStore(storeId: string): Promise<Store> {
  let store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');

  if (store.tokenExpiresAt && store.tokenExpiresAt.getTime() - Date.now() < 120_000) {
    store = await refreshAccessToken(store);
  }
  return store;
}

export async function sallaFetch(storeId: string, path: string, init?: RequestInit, retry401 = true): Promise<Response> {
  let store = await ensureValidStore(storeId);
  const accessToken = decryptIfPossible(store.accessToken);
  if (!accessToken) throw new Error('No access token');

  const response = await fetch(`${env.SALLA_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(init?.headers || {})
    }
  });

  if (response.status === 401 && retry401) {
    store = await refreshAccessToken(store);
    const newToken = decryptIfPossible(store.accessToken);
    const second = await fetch(`${env.SALLA_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${newToken}`,
        Accept: 'application/json',
        ...(init?.headers || {})
      }
    });
    return second;
  }

  return response;
}

export async function fetchAllProducts(storeId: string): Promise<ProductRecord[]> {
  const all: ProductRecord[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    let retries = 0;
    let response: Response | null = null;

    while (retries < 5) {
      response = await sallaFetch(storeId, `/admin/v2/products?page=${page}&per_page=${perPage}`);
      if (response.ok) break;
      if (response.status === 429 || response.status >= 500) {
        await sleep(2 ** retries * 300);
        retries += 1;
        continue;
      }
      throw new Error(`Salla products request failed: ${response.status}`);
    }

    if (!response || !response.ok) throw new Error('Failed after retries');
    const json = await response.json();
    const rows = Array.isArray(json.data) ? json.data : [];

    rows.forEach((item: any) => {
      all.push({
        productId: String(item.id),
        title: item.name || item.title || 'Untitled',
        price: Number(item.price ?? item.regular_price ?? 0),
        imageUrl: item.image?.url ?? item.image ?? null
      });
    });

    const hasNext = Boolean(json.pagination?.next_page || (rows.length === perPage));
    if (!hasNext) break;

    page += 1;
    await sleep(150);
  }

  return all;
}
