import { useState } from 'react';
import { Package, RefreshCw } from 'lucide-react';

export default function InventoryControlCard({ stock, onRestock }) {
  const [quantity, setQuantity] = useState(15);

  const handleRestock = () => {
    onRestock(quantity);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-glow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="text-primary" size={24} />
          Inventory Control
        </h2>
        <span className="text-sm text-gray-400">item_123</span>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Current Stock</div>
        <div className="text-5xl font-bold text-white mb-2">{stock}</div>
        <div className="text-sm text-gray-500">units available</div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="text-sm text-gray-400 mb-3">Restock / Reset</div>
        <div className="flex gap-3">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="flex-1 bg-surface2 border border-border rounded-md px-4 py-2 text-white focus:outline-none focus:border-primary"
            min="0"
          />
          <button
            onClick={handleRestock}
            className="flex items-center gap-2 bg-primary hover:bg-indigo-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            <RefreshCw size={18} />
            Restock
          </button>
        </div>
      </div>
    </div>
  );
}
