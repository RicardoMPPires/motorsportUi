'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TelemetryData {
  packetId: number;
  gas: number;
  brake: number;
  fuel: number;
  gear: number;
  rpms: number;
  steerAngle: number;
  speedKmh: number;
  lapNumber: number;
  time: number;
}

interface LapData {
  id: number;
  lapNumber: number;
  driverName?: string;
  circuitName?: string;
  car?: string;
  session?: string;
  run?: string;
  isBestLap: boolean;
  createdAt: string;
  lapTime: number;
  telemetryPackets: TelemetryData[];
}

const formatLapTime = (lapTimeSeconds: number): string => {
  const minutes = Math.floor(lapTimeSeconds / 60);
  const seconds = Math.floor(lapTimeSeconds % 60);
  const ms = Math.floor((lapTimeSeconds - Math.floor(lapTimeSeconds)) * 100);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export default function LapsPage() {
  const [laps, setLaps] = useState<LapData[]>([]);
  const [darkMode, setDarkMode] = useState(true);

  const loadLaps = useCallback(async () => {
    try {
      const res = await fetch('/api/laps');
      const data = await res.json();
      setLaps(data);
    } catch (err) {
      console.error('Error loading laps:', err);
    }
  }, []);

  useEffect(() => {
    loadLaps();
  }, [loadLaps]);

  const markAsBestLap = async (lapId: number) => {
    try {
      const res = await fetch(`/api/laps/${lapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBestLap: true })
      });
      
      if (res.ok) {
        await loadLaps();
      }
    } catch (err) {
      console.error('Error marking best lap:', err);
    }
  };

  const deleteLap = async (lapId: number) => {
    if (!confirm('Are you sure you want to delete this lap?')) return;
    try {
      const res = await fetch(`/api/laps/${lapId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        await loadLaps();
      }
    } catch (err) {
      console.error('Error deleting lap:', err);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900'} p-4 md:p-8`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'} mb-2`}>Laps Overview</h1>
              <p className={`${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>View and manage your saved laps</p>
            </div>
          </div>
          <div className="flex gap-2">
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
          </div>
        </header>

        {laps.length === 0 ? (
          <div className={`rounded-2xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} p-12 text-center`}>
            <p className={`text-xl ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>No laps saved yet</p>
            <p className={`mt-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Complete some laps to see them here</p>
            <Link href="/" className="mt-6 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {laps.map(lap => (
              <div 
                key={lap.id} 
                className={`rounded-2xl border p-6 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} ${lap.isBestLap ? 'border-yellow-500' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${lap.isBestLap ? 'bg-yellow-500/20 text-yellow-500' : darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                      {lap.lapNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                          Lap {lap.lapNumber}
                        </h3>
                        {lap.isBestLap && (
                          <span className="text-yellow-500 text-lg">⭐</span>
                        )}
                      </div>
                      <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        <span>Driver: {lap.driverName || 'Unknown'}</span>
                        <span>Circuit: {lap.circuitName || 'Unknown'}</span>
                        <span>Car: {lap.car || 'Unknown'}</span>
                        <span>Session: {lap.session || 'Unknown'}</span>
                        <span>Run: {lap.run || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider`}>Lap Time</p>
                      <p className="text-lg font-mono font-bold">
                        {formatLapTime(lap.lapTime)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!lap.isBestLap && (
                        <button
                          onClick={() => markAsBestLap(lap.id)}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition-colors"
                        >
                          Set Best
                        </button>
                      )}
                      <button
                        onClick={() => deleteLap(lap.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
