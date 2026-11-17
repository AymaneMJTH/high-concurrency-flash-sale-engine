import { Activity, Database, MessageSquare, Server } from 'lucide-react';

export default function SystemHealthBar({ health }) {
  const healthItems = [
    { name: 'API', icon: Server, key: 'api', status: true },
    { name: 'Redis', icon: Database, key: 'redis', status: health?.redis },
    { name: 'RabbitMQ', icon: MessageSquare, key: 'rabbitmq', status: health?.rabbitmq },
    { name: 'PostgreSQL', icon: Activity, key: 'postgres', status: health?.postgres },
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {healthItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface2 border border-border"
          >
            <item.icon
              size={18}
              className={item.status ? 'text-success' : 'text-error'}
            />
            <span className="text-sm font-medium text-gray-300">{item.name}</span>
            <div
              className={`w-2 h-2 rounded-full ${
                item.status ? 'bg-success shadow-glow-green' : 'bg-error shadow-glow-red'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
