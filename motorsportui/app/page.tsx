'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [driverName, setDriverName] = useState('');
  const [circuitName, setCircuitName] = useState('');
  const [car, setCar] = useState('');
  const [session, setSession] = useState('');
  const [run, setRun] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save session info to localStorage
    localStorage.setItem('sessionData', JSON.stringify({
      driverName,
      circuitName,
      car,
      session,
      run
    }));
    
    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900'} p-4 md:p-8`}>
      <div className="max-w-2xl w-full">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className={`text-4xl md:text-5xl font-extrabold ${darkMode ? 'text-white' : 'text-zinc-900'} mb-2`}>
              Painel de controlo IPS driver development
            </h1>
            <p className={`text-lg ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Start a new telemetry session</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-full transition-colors ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white border border-zinc-200 hover:bg-zinc-100'}`}
          >
            {darkMode ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        {/* Session Form */}
        <form onSubmit={handleStartSession} className={`rounded-2xl border p-8 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            Session Information
          </h2>

          <div className="space-y-6 mb-8">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
                required
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-500'} border rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Circuit Name</label>
              <input
                type="text"
                value={circuitName}
                onChange={(e) => setCircuitName(e.target.value)}
                placeholder="Enter circuit name"
                required
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-500'} border rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Car</label>
              <input
                type="text"
                value={car}
                onChange={(e) => setCar(e.target.value)}
                placeholder="Enter car model"
                required
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-500'} border rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Session</label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Enter session"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-500'} border rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Run</label>
              <input
                type="text"
                value={run}
                onChange={(e) => setRun(e.target.value)}
                placeholder="Enter run"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-500'} border rounded-lg px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl text-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  );
}
