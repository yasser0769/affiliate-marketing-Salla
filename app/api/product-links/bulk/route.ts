import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bulkSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bulkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { store_id, items } = parsed.data;

  await prisma.$transaction(
    items.map((item) =>
      prisma.productLink.upsert({
        where: { storeId_productId: { storeId: store_id, productId: item.productId } },
        create: {
          storeId: store_id,
          productId: item.productId,
          buttonText: item.buttonText ?? 'اشترِ من الخارج',
          buttonUrl: item.buttonUrl ?? null,
          openNewTab: item.openNewTab ?? true
        },
        update: {
          buttonText: item.buttonText ?? null,
          buttonUrl: item.buttonUrl ?? null,
          openNewTab: item.openNewTab ?? true
        }
      })
    )
  );

  return NextResponse.json({ ok: true, count: items.length });
}
