import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { Camera, Loader2, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({ name, timezone });
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your personal information.</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white">
              {user ? getInitials(user.name) : '?'}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-slate-700 hover:bg-slate-600 border-2 border-slate-900 rounded-full flex items-center justify-center transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <p className="text-xs text-slate-500 mt-1">
              Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-100 mb-5">Edit Profile</h3>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-slate-300 mb-1.5">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Chicago">America/Chicago (CST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
