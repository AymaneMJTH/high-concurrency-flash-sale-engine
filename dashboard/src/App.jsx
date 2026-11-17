import { useState, useEffect } from 'react';
import SystemHealthBar from './components/SystemHealthBar';
import InventoryControlCard from './components/InventoryControlCard';
import StressTestSimulator from './components/StressTestSimulator';
import RecentOrdersTable from './components/RecentOrdersTable';
import './index.css';

const API_BASE = 'http://localhost:3000';

function App() {
  const [stock, setStock] = useState(0);
  const [health, setHealth] = useState(null);
  const [orders, setOrders] = useState([]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/flash-sale/status/item_123`);
      const data = await response.json();
      setStock(data.currentStock);
      setHealth(data.health);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/flash-sale/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleRestock = async (quantity) => {
    try {
      await fetch(`${API_BASE}/flash-sale/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: 'item_123', quantity }),
      });
      await fetchStatus();
    } catch (error) {
      console.error('Failed to restock:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchOrders();

    const interval = setInterval(() => {
      fetchStatus();
      fetchOrders();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Flash Sale Dashboard</h1>
          <p className="text-gray-400">Real-time monitoring and control</p>
        </header>

        <SystemHealthBar health={health} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <InventoryControlCard stock={stock} onRestock={handleRestock} />
          <StressTestSimulator />
        </div>

        <RecentOrdersTable orders={orders} />
      </div>
    </div>
  );
}

export default App;
