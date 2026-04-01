import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../api/client';
import OrderTile from '../../components/orders/OrderTile';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api('/api/orders');
        if (!isMounted) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.error || err?.message || 'Failed to load orders.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-600 mt-1">Track all your placed orders and related actions.</p>
          </div>
          <Link
            to="/account"
            className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 text-sm font-semibold hover:bg-orange-50 transition"
          >
            Back to Account
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 space-y-4">
            {[0, 1].map((idx) => (
              <div key={idx} className="rounded-2xl border border-orange-100 bg-white p-5 space-y-3">
                <div className="account-shimmer h-4 w-1/3 rounded-md" />
                <div className="account-shimmer h-5 w-1/4 rounded-md" />
                <div className="account-shimmer h-16 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-orange-100 bg-white p-5">
            <p className="text-sm font-medium text-gray-800">No orders found.</p>
            <p className="mt-1 text-sm text-gray-600">Place your first order to see it here.</p>
          </div>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <OrderTile key={order?._id || order?.orderNumber} order={order} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Orders;
