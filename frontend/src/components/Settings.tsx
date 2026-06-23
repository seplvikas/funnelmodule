import React, { useState } from 'react';
import { Mail, Save } from 'lucide-react';

export function Settings() {
  const [emailSettings, setEmailSettings] = useState({
    primary_email: localStorage.getItem('primary_email') || '',
    reminder_days: parseInt(localStorage.getItem('reminder_days') || '30', 10),
    notification_enabled: localStorage.getItem('notification_enabled') !== 'false',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: any) => {
    setEmailSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('primary_email', emailSettings.primary_email);
    localStorage.setItem('reminder_days', emailSettings.reminder_days.toString());
    localStorage.setItem('notification_enabled', emailSettings.notification_enabled.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your preferences and notification settings</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
          ✓ Settings saved successfully!
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="border-b pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="text-blue-600" /> Email Notifications
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Email Address
              </label>
              <input
                type="email"
                value={emailSettings.primary_email}
                onChange={(e) => handleChange('primary_email', e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                This email will receive all expiry notifications
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Period (days before expiry)
              </label>
              <div className="flex gap-2">
                {[7, 14, 30, 60].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleChange('reminder_days', days)}
                    className={`px-4 py-2 rounded-lg transition ${
                      emailSettings.reminder_days === days
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You'll receive notifications this many days before the expiry date
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notification_enabled"
                checked={emailSettings.notification_enabled}
                onChange={(e) => handleChange('notification_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="notification_enabled" className="text-sm font-medium text-gray-700">
                Enable email notifications
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Save size={20} /> Save Settings
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
        <p className="text-blue-800 text-sm">
          You can add multiple email addresses per product in the product details. Each product can have its own list of notification recipients.
        </p>
      </div>
    </div>
  );
}
