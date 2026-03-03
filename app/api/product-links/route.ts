import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storeIdSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('store_id');
  const parsed = storeIdSchema.safeParse(storeId);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid store_id' }, { status: 400 });

  const links = await prisma.productLink.findMany({ where: { storeId: parsed.data } });
  return NextResponse.json({ items: links });
}
