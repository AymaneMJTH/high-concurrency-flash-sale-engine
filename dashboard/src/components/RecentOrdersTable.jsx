import { ShoppingCart } from 'lucide-react';

export default function RecentOrdersTable({ orders }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShoppingCart className="text-primary" size={24} />
          Recent Orders
        </h2>
        <span className="text-sm text-gray-400">Last 50 confirmed orders</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Order ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Customer Ref</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Quantity</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-surface2 transition-colors">
                  <td className="py-3 px-4 text-sm text-white font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{order.customer_ref}</td>
                  <td className="py-3 px-4 text-sm text-white">{order.quantity}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
