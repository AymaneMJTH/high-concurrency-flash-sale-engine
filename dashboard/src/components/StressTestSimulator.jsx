import { useState } from 'react';
import { Zap, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

export default function StressTestSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);

  const runStressTest = async () => {
    setIsRunning(true);
    setSuccessCount(0);
    setConflictCount(0);

    const concurrentRequests = 50;
    const requests = [];

    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        fetch(`${API_BASE}/flash-sale/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idempotencyKey: `test_${Date.now()}_${i}`,
            productId: 'item_123',
            customerRef: `customer_${i}`,
            quantity: 1,
          }),
        })
          .then((res) => {
            if (res.ok) {
              setSuccessCount((prev) => prev + 1);
            } else if (res.status === 409) {
              setConflictCount((prev) => prev + 1);
            }
          })
          .catch(() => {}),
      );
    }

    await Promise.all(requests);
    setIsRunning(false);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-glow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap className="text-warning" size={24} />
          Stress Test Simulator
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface2 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-success" size={20} />
            <span className="text-sm text-gray-400">200 Success</span>
          </div>
          <div className="text-3xl font-bold text-success">{successCount}</div>
        </div>
        <div className="bg-surface2 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="text-error" size={20} />
            <span className="text-sm text-gray-400">409 Conflict</span>
          </div>
          <div className="text-3xl font-bold text-error">{conflictCount}</div>
        </div>
      </div>

      <button
        onClick={runStressTest}
        disabled={isRunning}
        className="w-full bg-warning hover:bg-amber-600 disabled:bg-gray-600 text-black font-semibold px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <Zap size={20} />
        {isRunning ? 'Running Test...' : 'Run Stress Test (50 concurrent requests)'}
      </button>
    </div>
  );
}
