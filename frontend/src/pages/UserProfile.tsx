import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Clock, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

export default function UserProfile() {
  const { user, username, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  const createdAt = user?.created_at ? new Date(user.created_at) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">User Profile</h2>
        <p className="text-slate-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{username}</h3>
                <p className="text-slate-600 text-sm">Network Administrator</p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">Active Account</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</p>
                  <p className="text-sm font-semibold text-slate-900">{username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</p>
                  <p className="text-xs font-mono text-slate-700">{user?.id}</p>
                </div>
              </div>

              {createdAt && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-slate-200 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Since</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {createdAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">Email Verified</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Full Dashboard Access</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">Two-Factor Authentication</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-1 rounded">
                  Not Configured
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">Sign Out</h3>
            </div>
            <p className="text-sm text-red-100 mb-6 leading-relaxed">
              End your current session and return to the login screen.
            </p>

            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full bg-white text-red-600 font-semibold py-3 px-4 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                  <p className="text-sm font-medium text-center">Are you sure?</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={isLoggingOut}
                    className="bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/30 transition-all text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="bg-white text-red-600 font-semibold py-2 px-3 rounded-lg hover:bg-red-50 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Sessions Today</span>
                  <span className="font-semibold text-slate-900">1</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Dashboard Views</span>
                  <span className="font-semibold text-slate-900">4</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '80%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Alerts Reviewed</span>
                  <span className="font-semibold text-slate-900">12</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Security Tip</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Always sign out when using shared devices to protect your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
