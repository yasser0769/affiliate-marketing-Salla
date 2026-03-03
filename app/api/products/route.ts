import { NextRequest, NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/salla';
import { storeIdSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('store_id');
  const parsed = storeIdSchema.safeParse(storeId);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid store_id' }, { status: 400 });

  try {
    const products = await fetchAllProducts(parsed.data);
    return NextResponse.json({ items: products, force: request.nextUrl.searchParams.get('force') === '1' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
