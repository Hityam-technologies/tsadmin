import React, { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { billingService } from '../services/billingService';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import {
  Smartphone,
  AlertTriangle,
  Save,
} from 'lucide-react';

function readConfig(data) {
  const flags = data?.featureFlags || {};
  const tryOnOn = flags.enableTryOn !== false && flags.tryOnEnabled !== false;
  return {
    minAppVersion: data?.minAppVersion || '1.0.0',
    forceUpdate: Boolean(data?.forceUpdate),
    maintenanceMode: Boolean(data?.maintenanceMode),
    maintenanceNotice: data?.maintenanceNotice || '',
    tryOnModel: data?.tryOnModel || 'tryon-v1.6',
    tryOnDailyLimitPerUser: data?.tryOnDailyLimitPerUser ?? 20,
    gstRate: data?.gstRate ?? 5,
    featureFlags: {
      enableTryOn: tryOnOn,
      enableBespokeConcierge: flags.enableBespokeConcierge !== false,
      enableInternationalShipping: Boolean(flags.enableInternationalShipping),
      enableWishlistSharing: flags.enableWishlistSharing !== false,
      enableVideoReelsAutoplay: flags.enableVideoReelsAutoplay !== false,
    },
    updatedAt: data?.updatedAt || '',
    updatedBy: data?.updatedBy || '',
  };
}

export function SystemSettingsPage() {
  const { showToast } = useToast();

  const [config, setConfig] = useState(readConfig(null));

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      const res = await systemService.getConfig();
      if (res.success) {
        setConfig(readConfig(res.data));
      }
    }
    loadConfig();
  }, []);

  const handleToggleFeature = (flagKey) => {
    setConfig({
      ...config,
      featureFlags: {
        ...config.featureFlags,
        [flagKey]: !config.featureFlags[flagKey],
      },
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await systemService.updateConfig({
      minAppVersion: config.minAppVersion,
      forceUpdate: Boolean(config.forceUpdate),
      maintenanceMode: Boolean(config.maintenanceMode),
      maintenanceNotice: config.maintenanceNotice || '',
      tryOnModel: config.tryOnModel || 'tryon-v1.6',
      tryOnDailyLimitPerUser: Number(config.tryOnDailyLimitPerUser) || 20,
      gstRate: Number(config.gstRate) || 0,
      featureFlags: {
        enableTryOn: Boolean(config.featureFlags?.enableTryOn),
        enableBespokeConcierge: Boolean(config.featureFlags?.enableBespokeConcierge),
        enableInternationalShipping: Boolean(config.featureFlags?.enableInternationalShipping),
        enableWishlistSharing: Boolean(config.featureFlags?.enableWishlistSharing),
        enableVideoReelsAutoplay: Boolean(config.featureFlags?.enableVideoReelsAutoplay),
      },
    });
    setSaving(false);
    if (!res.success) {
      showToast(res.error?.message || 'Settings were not saved.', 'error');
      return;
    }
    setConfig(readConfig(res.data));
    showToast('System settings saved.', 'success');
  };

  const flagsMeta = [
    {
      key: 'enableTryOn',
      title: 'AI 3D Virtual Try-On Studio',
      description: 'Enable the photogrammetric neural drape simulation studio in customer app wardrobe.',
    },
    {
      key: 'enableBespokeConcierge',
      title: 'Direct WhatsApp Concierge',
      description: 'Render instant WhatsApp consultation triggers on saree detail pages.',
    },
    {
      key: 'enableInternationalShipping',
      title: 'International Dispatch Logistics',
      description: 'Permit international address checkouts with automated customs and VAT calculations.',
    },
    {
      key: 'enableWishlistSharing',
      title: 'Wishlist & Lookbook Sharing',
      description: 'Allow customers to generate shareable web deep links for their curated wardrobe.',
    },
    {
      key: 'enableVideoReelsAutoplay',
      title: 'Hero Video Autoplay',
      description: 'Stream haute-couture fashion week video reel immediately upon mobile app launch.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-sand-300 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">
            System & Infrastructure
          </span>
          <h1 className="font-serif text-2xl font-bold text-charcoal-900 mt-0.5">
            System Configuration & Feature Flags
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Configure mobile runtime barriers, emergency force-update gates, and toggle live application features.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white font-medium text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Deploy System Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: App Version & Emergency Barriers */}
        <div className="space-y-6">
          {/* Mobile Barrier Box */}
          <div className="bg-white p-5 rounded-2xl border border-sand-300 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-sand-200">
              <div className="p-2 rounded-xl bg-gold-50 text-gold-700 border border-gold-200">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-charcoal-900">
                  Mobile Version Gate
                </h3>
                <span className="text-[10px] text-charcoal-500">React Native Customer App</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Minimum Required App Version
              </label>
              <input
                type="text"
                value={config.minAppVersion || ''}
                onChange={(e) => setConfig({ ...config, minAppVersion: e.target.value })}
                placeholder="1.2.0"
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono text-charcoal-900 focus:border-gold-500"
              />
              <span className="text-[10px] text-charcoal-400 mt-1 block">
                Devices below this SemVer release will be gated upon opening.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">Try-on model</label>
              <select
                value={config.tryOnModel || 'tryon-v1.6'}
                onChange={(e) => setConfig({ ...config, tryOnModel: e.target.value })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900"
              >
                <option value="tryon-v1.6">tryon-v1.6</option>
                <option value="tryon-max">tryon-max</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">GST rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={config.gstRate ?? 5}
                onChange={(e) => setConfig({ ...config, gstRate: Number(e.target.value) })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900"
              />
              <span className="text-[10px] text-charcoal-400 mt-1 block">
                Inclusive GST used on the next bill. Completed invoices keep the rate they were raised with.
              </span>
            </div>
            <CashierPinForm />
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">Daily try-ons per customer</label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.tryOnDailyLimitPerUser ?? ''}
                onChange={(e) => setConfig({ ...config, tryOnDailyLimitPerUser: Number(e.target.value) })}
                className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900"
              />
            </div>

            <div className="pt-2 border-t border-sand-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-charcoal-900 block">
                    Force Update Barrier
                  </span>
                  <span className="text-[10px] text-charcoal-500">
                    Block app usage until customer installs latest update.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, forceUpdate: !config.forceUpdate })}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                    config.forceUpdate ? 'bg-amber-600' : 'bg-sand-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      config.forceUpdate ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Maintenance Mode Box */}
          <div className="bg-white p-5 rounded-2xl border border-sand-300 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-sand-200">
              <div className="p-2 rounded-xl bg-maroon-50 text-maroon-700 border border-maroon-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-charcoal-900">
                  Loom Maintenance Mode
                </h3>
                <span className="text-[10px] text-charcoal-500">Emergency customer app pause</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-charcoal-900 block">
                  Enable Maintenance Shield
                </span>
                <span className="text-[10px] text-charcoal-500">
                  Displays maintenance notice to customers.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                  config.maintenanceMode ? 'bg-maroon-600' : 'bg-sand-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    config.maintenanceMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Customer Maintenance Notice
              </label>
              <textarea
                rows={3}
                value={config.maintenanceNotice || ''}
                onChange={(e) => setConfig({ ...config, maintenanceNotice: e.target.value })}
                placeholder="Message customers see while the app is paused"
                className="w-full rounded-xl border border-sand-300 p-2 text-xs focus:border-maroon-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Feature Flags */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-sand-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                Live Dynamic Feature Flags
              </h3>
              <p className="text-xs text-charcoal-500">
                Toggle capabilities instantly on active client devices without submitting mobile app updates.
              </p>
            </div>
            <Badge variant="gold" size="xs">
              Instant Sync
            </Badge>
          </div>

          <div className="divide-y divide-sand-200">
            {flagsMeta.map((flag) => {
              const isEnabled = !!config.featureFlags?.[flag.key];
              return (
                <div key={flag.key} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-charcoal-900 block">
                      {flag.title}
                    </span>
                    <p className="text-xs text-charcoal-500 max-w-md">{flag.description}</p>
                    <span className="text-[10px] text-charcoal-400 font-mono">
                      Flag: {flag.key}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFeature(flag.key)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex-shrink-0 ${
                      isEnabled ? 'bg-gold-600' : 'bg-sand-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-sand-200 flex items-center justify-between text-[11px] text-charcoal-400">
            <span>Last synchronized: {config.updatedAt ? new Date(config.updatedAt).toLocaleString('en-IN') : '-'}</span>
            <span>Modified by: {config.updatedBy || '-'}</span>
          </div>
        </div>
      </div>
      <PasswordCard />
    </div>
  );
}

function CashierPinForm() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!/^\d{6}$/.test(pin)) {
      showToast('The billing PIN must be 6 digits.', 'error');
      return;
    }
    setSaving(true);
    const res = await billingService.createCashier({ name, pin, role: 'Cashier', register: 'Counter 01' });
    setSaving(false);
    if (!res.success) {
      showToast(res.error?.message || 'The cashier was not saved.', 'error');
      return;
    }
    setName('');
    setPin('');
    showToast(`${res.data.staff.name} can now open the billing register.`, 'success');
  };

  return (
    <div className="space-y-2 rounded-xl border border-sand-200 p-3">
      <p className="text-xs font-semibold text-charcoal-900">Billing cashier</p>
      <p className="text-[10px] text-charcoal-500">This PIN opens the register. It is not the admin password.</p>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Cashier name"
        className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900"
      />
      <input
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="6-digit PIN"
        className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono text-charcoal-900"
      />
      <button type="button" onClick={submit} disabled={saving} className="px-3 py-2 rounded-xl bg-charcoal-900 text-white text-xs disabled:opacity-50">
        {saving ? 'Saving...' : 'Save cashier PIN'}
      </button>
    </div>
  );
}

function PasswordCard() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await authService.changePassword(currentPassword, newPassword);
    setSaving(false);
    if (!result.success) {
      showToast(result.error?.message || 'The password was not changed.', 'error');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    showToast('Password updated.', 'success');
  };

  return (
    <form onSubmit={submit} className="bg-white p-5 rounded-2xl border border-sand-300 shadow-sm space-y-3 max-w-lg">
      <h3 className="font-serif font-bold text-sm text-charcoal-900">Change password</h3>
      <input
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        placeholder="Current password"
        className="w-full rounded-xl border border-sand-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="New password"
        className="w-full rounded-xl border border-sand-300 px-3 py-2 text-sm"
      />
      <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-gold-600 text-white text-xs disabled:opacity-50">
        {saving ? 'Updating...' : 'Update password'}
      </button>
    </form>
  );
}
