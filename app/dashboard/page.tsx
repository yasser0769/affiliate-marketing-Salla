import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard-client';

export default async function DashboardPage({ searchParams }: { searchParams: { store_id?: string } }) {
  const storeId = searchParams.store_id;
  if (!storeId) {
    return <main className="p-8">يرجى تمرير store_id في الرابط.</main>;
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return <main className="p-8">Store not authorized yet</main>;
  }

  return <DashboardClient storeId={storeId} />;
}
