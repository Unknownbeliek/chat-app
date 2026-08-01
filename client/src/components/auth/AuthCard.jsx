import React from 'react';

export default function AuthCard({
  authMode,
  setAuthMode,
  username,
  setUsername,
  password,
  setPassword,
  authError,
  isLoading,
  onSubmit
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl relative z-10 border border-white/10 space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <h1 className="font-extrabold text-3xl tracking-tight text-white">ping</h1>
          <p className="text-xs text-zinc-400">
            {authMode === "login"
              ? "Welcome back! Enter your credentials to sign in."
              : "Create an account to join Global Chat & Direct Messaging."}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setAuthMode("login")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === "login"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === "register"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rajkumar"
              className="w-full glass-input px-4 py-3 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input px-4 py-3 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all duration-200"
          >
            {isLoading
              ? "Authenticating..."
              : authMode === "login"
              ? "Sign In to Ping"
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
