'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Settings {
  demoMode: boolean;
  aiProvider: string;
  integrations: Record<string, boolean>;
}

const integrations = [
  { key: 'unify', name: 'Unify', role: 'Proof Expansion Engine (RAG over /conversations)', envKeys: ['UNIFY_API_KEY', 'UNIFY_API_URL'], note: 'GET {base}/conversations · Bearer auth' },
  { key: 'gtmengineer', name: 'GTMengineer.dev', role: 'GTM System Generator', envKeys: ['GTMENGINEER_API_KEY', 'GTMENGINEER_API_URL'], note: 'Simulated internally' },
  { key: 'faxxing', name: 'Faxxing', role: 'Proof Amplification Engine', envKeys: ['FAXXING_API_KEY', 'FAXXING_API_URL'] },
  { key: 'zero', name: 'Zero', role: 'Proof CRM', envKeys: ['ZERO_API_KEY', 'ZERO_API_URL'] },
  { key: 'lightfern', name: 'Lightfern', role: 'Proof Validation Engine', envKeys: ['LIGHTFERN_API_KEY', 'LIGHTFERN_API_URL'] },
  { key: 'scaile', name: 'Scaile', role: 'Growth Recommendation Engine', envKeys: ['SCAILE_API_KEY', 'SCAILE_API_URL'] }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSettings().then((d) => setSettings(d as Settings));
  }, []);

  async function resetDemo() {
    setResetting(true);
    try {
      await api.resetDemo();
      setMessage('Demo data reset successfully!');
      setSettings((await api.getSettings()) as Settings);
    } catch {
      setMessage('Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  }

  async function toggleDemo() {
    if (!settings) return;
    const next = !settings.demoMode;
    await api.updateSettings({ demoMode: next });
    setSettings({ ...settings, demoMode: next });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure demo mode, AI providers, and sponsor integration ENV keys.</p>
      </div>
      {message && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-400">{message}</div>}
      {settings && (
        <Card className="space-y-4">
          <h2 className="font-semibold">Demo Mode</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm">Enable demo mode with preloaded proof data</p>
            <button onClick={toggleDemo} className={`relative h-7 w-12 rounded-full transition-colors ${settings.demoMode ? 'bg-primary' : 'bg-muted'}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${settings.demoMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <Button variant="outline" onClick={resetDemo} disabled={resetting}>{resetting ? 'Resetting...' : 'Reset Demo Data'}</Button>
        </Card>
      )}
      <Card className="space-y-4">
        <h2 className="font-semibold">Sponsor Integrations</h2>
        <p className="text-sm text-muted-foreground">Add API keys to .env to activate live connections.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {integrations.map((integration) => (
            <div key={integration.key} className="rounded-lg border border-border p-4 space-y-2 hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{integration.name}</h3>
                <Badge className={settings?.integrations[integration.key] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground'}>
                  {settings?.integrations[integration.key] ? 'Connected' : 'Ready'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{integration.role}</p>
              {integration.note && <p className="text-xs text-violet-400">{integration.note}</p>}
              <div className="flex flex-wrap gap-1">{integration.envKeys.map((k) => <code key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{k}</code>)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
