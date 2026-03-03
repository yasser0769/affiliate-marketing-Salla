import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productIdSchema, storeIdSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(ip)) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  const storeId = request.nextUrl.searchParams.get('store_id');
  const productId = request.nextUrl.searchParams.get('product_id');

  const parsedStore = storeIdSchema.safeParse(storeId);
  const parsedProduct = productIdSchema.safeParse(productId);
  if (!parsedStore.success || !parsedProduct.success) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  const link = await prisma.productLink.findUnique({
    where: { storeId_productId: { storeId: parsedStore.data, productId: parsedProduct.data } }
  });

  const validUrl = link?.buttonUrl && /^https?:\/\//i.test(link.buttonUrl);
  if (!link || !validUrl) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  return NextResponse.json(
    {
      button_text: link.buttonText || 'اشترِ من الخارج',
      button_url: link.buttonUrl,
      open_new_tab: link.openNewTab
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    }
  );
}
