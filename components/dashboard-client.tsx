'use client';

import { useMemo, useState } from 'react';

type Product = { productId: string; title: string; price: number; imageUrl: string | null };
type LinkMap = { buttonText: string; buttonUrl: string; openNewTab: boolean };

export default function DashboardClient({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [links, setLinks] = useState<Record<string, LinkMap>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => `${p.title} ${p.productId}`.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const syncProducts = async () => {
    setLoading(true);
    const [productsRes, linksRes] = await Promise.all([
      fetch(`/api/products?store_id=${storeId}&force=1`).then((r) => r.json()),
      fetch(`/api/product-links?store_id=${storeId}`).then((r) => r.json())
    ]);
    setProducts(productsRes.items || []);
    const nextLinks: Record<string, LinkMap> = {};
    (linksRes.items || []).forEach((item: any) => {
      nextLinks[item.productId] = {
        buttonText: item.buttonText || 'اشترِ من الخارج',
        buttonUrl: item.buttonUrl || '',
        openNewTab: item.openNewTab
      };
    });
    setLinks(nextLinks);
    setLoading(false);
  };

  const saveBulk = async () => {
    const items = Object.entries(links).map(([productId, value]) => ({ productId, ...value }));
    await fetch('/api/product-links/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: storeId, items })
    });
    alert('تم حفظ البيانات');
  };

  const saveRow = async (productId: string) => {
    const value = links[productId];
    if (!value) return;
    await fetch('/api/product-links/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_id: storeId, items: [{ productId, ...value }] })
    });
    alert(`تم حفظ المنتج ${productId}`);
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-bold">لوحة التحكم - متجر {storeId}</h1>
      <div className="mt-4 flex gap-3">
        <button onClick={syncProducts} className="rounded bg-slate-900 px-4 py-2 text-white" type="button">
          {loading ? 'جاري المزامنة...' : 'Sync Products'}
        </button>
        <button onClick={saveBulk} className="rounded bg-emerald-600 px-4 py-2 text-white" type="button">
          Bulk Save
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالعنوان أو product_id"
          className="rounded border px-3 py-2"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded bg-white p-3 shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-right">
              <th className="p-2">الصورة</th>
              <th className="p-2">العنوان</th>
              <th className="p-2">السعر</th>
              <th className="p-2">product_id</th>
              <th className="p-2">button_text</th>
              <th className="p-2">button_url</th>
              <th className="p-2">open_new_tab</th>
              <th className="p-2">حفظ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const value = links[product.productId] ?? { buttonText: 'اشترِ من الخارج', buttonUrl: '', openNewTab: true };
              return (
                <tr key={product.productId} className="border-b align-top">
                  <td className="p-2">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-12 w-12 rounded object-cover" /> : '-'}
                  </td>
                  <td className="p-2">{product.title}</td>
                  <td className="p-2">{product.price}</td>
                  <td className="p-2">{product.productId}</td>
                  <td className="p-2">
                    <input
                      className="w-44 rounded border px-2 py-1"
                      value={value.buttonText}
                      onChange={(e) =>
                        setLinks((prev) => ({ ...prev, [product.productId]: { ...value, buttonText: e.target.value } }))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-72 rounded border px-2 py-1"
                      value={value.buttonUrl}
                      onChange={(e) =>
                        setLinks((prev) => ({ ...prev, [product.productId]: { ...value, buttonUrl: e.target.value } }))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={value.openNewTab}
                      onChange={(e) =>
                        setLinks((prev) => ({ ...prev, [product.productId]: { ...value, openNewTab: e.target.checked } }))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => saveRow(product.productId)}
                      className="rounded bg-blue-600 px-3 py-1 text-white"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
