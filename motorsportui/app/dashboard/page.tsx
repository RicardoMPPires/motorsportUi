'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';

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
  lapTime?: number; // Lap time in seconds (only available on the last packet of a lap)
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

export default function Dashboard() {
  const [driverName, setDriverName] = useState('');
  const [circuitName, setCircuitName] = useState('');
  const [car, setCar] = useState('');
  const [session, setSession] = useState('');
  const [run, setRun] = useState('');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);
  const [currentData, setCurrentData] = useState<TelemetryData | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [selectedLapId, setSelectedLapId] = useState<number | null>(null);
  const [bestLapData, setBestLapData] = useState<TelemetryData[]>([]);
  const currentLapPacketsRef = useRef<TelemetryData[]>([]);
  const currentLapNumberRef = useRef(1);
  const router = useRouter();

  const MAX_DATA_POINTS = 100;

  // Load session and laps on mount
  const loadLaps = useCallback(async () => {
    try {
      // Load session data
      const savedSession = localStorage.getItem('sessionData');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setDriverName(parsed.driverName);
        setCircuitName(parsed.circuitName);
        setCar(parsed.car);
        setSession(parsed.session);
        setRun(parsed.run);
      } else {
        // If no session, redirect home
        router.push('/');
        return;
      }

      // Load saved laps
      const res = await fetch('/api/laps');
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error('Error loading laps:', data);
        return;
      }
      setLaps(data);
      const best = data.find((lap: LapData) => lap.isBestLap);
      if (best) {
        setBestLapData(best.telemetryPackets);
      }
    } catch (err) {
      console.error('Error loading laps:', err);
    }
  }, [router]);

  useEffect(() => {
    loadLaps();
  }, [loadLaps]);

  // Function to save a lap
  const saveLap = useCallback(async (packets: TelemetryData[], lapNumber: number, lapTime: number) => {
    if (packets.length === 0) return;
    
    try {
      const res = await fetch('/api/laps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lapNumber,
          driverName,
          circuitName,
          car,
          session,
          run,
          telemetryPackets: packets,
          lapTime
        })
      });
      
      if (res.ok) {
        await loadLaps();
      }
    } catch (err) {
      console.error('Error saving lap:', err);
    }
  }, [driverName, circuitName, car, session, run, loadLaps]);

  const saveLapRef = useRef(saveLap);
  saveLapRef.current = saveLap;

  // Live telemetry from the AC bridge script via /api/telemetry (SSE)
  useEffect(() => {
    const source = new EventSource('/api/telemetry');

    source.onmessage = (event) => {
      const frame = JSON.parse(event.data);
      const lapChanged = frame.lapNumber !== currentLapNumberRef.current;

      if (lapChanged) {
        if (currentLapPacketsRef.current.length > 0) {
          const lapTimeSeconds = (frame.lastLapTimeMs ?? 0) / 1000;
          saveLapRef.current(currentLapPacketsRef.current, currentLapNumberRef.current, lapTimeSeconds);
        }
        currentLapNumberRef.current = frame.lapNumber;
        currentLapPacketsRef.current = [];
      }

      const newData: TelemetryData = {
        packetId: frame.packetId,
        gas: frame.gas,
        brake: frame.brake,
        fuel: frame.fuel,
        gear: frame.gear,
        rpms: frame.rpms,
        steerAngle: frame.steerAngle,
        speedKmh: frame.speedKmh,
        lapNumber: frame.lapNumber,
        time: frame.time,
      };

      currentLapPacketsRef.current = [...currentLapPacketsRef.current, newData];
      setCurrentData(newData);
      setTelemetryHistory(prev => [...prev, newData].slice(-MAX_DATA_POINTS));
    };

    return () => source.close();
  }, []);

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

  const selectLap = (lapId: number) => {
    const lap = laps.find(l => l.id === lapId);
    if (lap) {
      setSelectedLapId(lapId);
      setTelemetryHistory(lap.telemetryPackets);
    }
  };

  const getDisplayData = () => {
    return selectedLapId 
      ? laps.find(l => l.id === selectedLapId)?.telemetryPackets || []
      : telemetryHistory;
  };

  const GraphCard = ({ 
    title, 
    dataKey, 
    color, 
    unit = '', 
    yDomain 
  }: { 
    title: string; 
    dataKey: keyof TelemetryData; 
    color: string; 
    unit?: string; 
    yDomain?: [number, number]; 
  }) => (
    <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
      <h3 className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'} text-sm font-medium mb-3`}>{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={getDisplayData()}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={yDomain || ['auto', 'auto']}
              stroke={darkMode ? '#52525b' : '#a1a1aa'}
              tick={{ fontSize: 12, fill: darkMode ? '#71717a' : '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                border: darkMode ? '1px solid #3f3f46' : '1px solid #e4e4e7',
                borderRadius: '8px'
              }}
              labelStyle={{ display: 'none' }}
              formatter={(value) => [`${Number(value).toFixed(1)} ${unit}`, title]}
            />
            {bestLapData.length > 0 && (
              <Line
                type="monotone"
                data={bestLapData}
                dataKey={dataKey}
                stroke="#9ca3af"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const CompositeTelemetryGraph = () => {
    const series = [
      { key: 'gear', name: 'Gear', color: '#eab308', domain: [0, 8] as [number, number], unit: '' },
      { key: 'rpms', name: 'RPM', color: '#ef4444', domain: [0, 10000] as [number, number], unit: ' rpm' },
      { key: 'speedKmh', name: 'Speed', color: '#3b82f6', domain: [0, 350] as [number, number], unit: ' km/h' },
      { key: 'steerAngle', name: 'Wheel Position', color: '#a855f7', domain: [-90, 90] as [number, number], unit: '°' },
      { key: 'brake', name: 'Brake', color: '#dc2626', domain: [0, 100] as [number, number], unit: '%' },
      { key: 'gas', name: 'Throttle', color: '#22c55e', domain: [0, 100] as [number, number], unit: '%' },
    ];

    return (
      <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border mt-6`}>
        <h3 className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'} text-sm font-medium mb-3`}>Composite Telemetry</h3>
        <div className="space-y-2">
          {series.map(s => (
            <div key={s.key} className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDisplayData()}>
                  <CartesianGrid strokeDasharray="2 2" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis
                    domain={s.domain}
                    stroke={s.color}
                    tick={{ fontSize: 8, fill: s.color }}
                    tickLine={false}
                    axisLine={{ stroke: s.color, strokeWidth: 1 }}
                    width={40}
                    tickCount={3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#18181b' : '#ffffff',
                      border: darkMode ? '1px solid #3f3f46' : '1px solid #e4e4e7',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value) => [`${Number(value).toFixed(1)}${s.unit}`, s.name]}
                  />
                  {bestLapData.length > 0 && (
                    <Line
                      type="monotone"
                      data={bestLapData}
                      dataKey={s.key}
                      stroke="#9ca3af"
                      strokeWidth={1}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <text
                    x={50}
                    y={15}
                    fontSize={12}
                    fontWeight="bold"
                    fill={s.color}
                  >
                    {s.name}
                  </text>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-zinc-100' : 'bg-zinc-50 text-zinc-900'} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'} mb-2`}>Painel de controlo IPS driver development</h1>
            <p className={`${darkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>Live race monitoring dashboard</p>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/" className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors">
              End Session
            </Link>
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

        {/* Driver Info Panel */}
        <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-2xl p-6 mb-8 border`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Session Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-600'} mb-2`}>Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Enter driver name"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400'} border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-600'} mb-2`}>Circuit</label>
              <input
                type="text"
                value={circuitName}
                onChange={(e) => setCircuitName(e.target.value)}
                placeholder="Enter circuit name"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400'} border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-600'} mb-2`}>Car</label>
              <input
                type="text"
                value={car}
                onChange={(e) => setCar(e.target.value)}
                placeholder="Enter car model"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400'} border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-600'} mb-2`}>Session</label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Enter session"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400'} border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-600'} mb-2`}>Run</label>
              <input
                type="text"
                value={run}
                onChange={(e) => setRun(e.target.value)}
                placeholder="Enter run"
                className={`w-full ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400'} border rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500`}
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            <Link href="/laps" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              View All Laps
            </Link>
            {selectedLapId && (
              <button
                onClick={() => setSelectedLapId(null)}
                className="px-6 py-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                View Live Data
              </button>
            )}
          </div>
          {laps.length > 0 && (
            <div className="mt-4">
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-500' : 'text-zinc-600'} mb-2`}>Saved Laps</label>
              <div className="flex flex-wrap gap-2">
                {laps.map(lap => (
                  <div key={lap.id} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${selectedLapId === lap.id ? 'border-blue-500 bg-blue-500/10' : darkMode ? 'border-zinc-700' : 'border-zinc-300'}`}>
                    <button
                      onClick={() => selectLap(lap.id)}
                      className="text-sm"
                    >
                      Lap {lap.lapNumber} {lap.isBestLap && '⭐'}
                    </button>
                    {!lap.isBestLap && (
                      <button
                        onClick={() => markAsBestLap(lap.id)}
                        className="text-xs text-yellow-500 hover:text-yellow-400"
                        title="Mark as best lap"
                      >
                        ★
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Stats */}
        {currentData && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>Speed</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{currentData.speedKmh.toFixed(0)} <span className={`text-sm font-normal ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>km/h</span></p>
            </div>
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>RPM</p>
              <p className="text-2xl font-bold text-red-400">{currentData.rpms.toFixed(0)}</p>
            </div>
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>Gear</p>
              <p className="text-2xl font-bold text-yellow-400">{currentData.gear}</p>
            </div>
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>Throttle</p>
              <p className="text-2xl font-bold text-green-400">{currentData.gas.toFixed(0)}<span className={`text-sm font-normal ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>%</span></p>
            </div>
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>Brake</p>
              <p className="text-2xl font-bold text-red-500">{currentData.brake.toFixed(0)}<span className={`text-sm font-normal ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>%</span></p>
            </div>
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>Fuel</p>
              <p className="text-2xl font-bold text-blue-400">{currentData.fuel.toFixed(1)}<span className={`text-sm font-normal ${darkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>L</span></p>
            </div>
            <div className={`${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
              <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} uppercase tracking-wider mb-1`}>Steering</p>
              <p className="text-2xl font-bold text-purple-400">{currentData.steerAngle.toFixed(0)}°</p>
            </div>
          </div>
        )}


        {/* Composite Telemetry Graph */}
        <CompositeTelemetryGraph />

        {/* Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <GraphCard title="Speed (km/h)" dataKey="speedKmh" color="#3b82f6" unit="km/h" yDomain={[0, 350]} />
          <GraphCard title="RPM" dataKey="rpms" color="#ef4444" unit="rpm" yDomain={[0, 10000]} />
          <GraphCard title="Throttle (%)" dataKey="gas" color="#22c55e" unit="%" yDomain={[0, 100]} />
          <GraphCard title="Brake (%)" dataKey="brake" color="#dc2626" unit="%" yDomain={[0, 100]} />
          <GraphCard title="Steering Angle (°)" dataKey="steerAngle" color="#a855f7" unit="°" yDomain={[-90, 90]} />
          <GraphCard title="Fuel (L)" dataKey="fuel" color="#38bdf8" unit="L" />
        </div>

        {/* Gear Chart */}
        <div className={`mt-6 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl p-4 border`}>
          <h3 className={`${darkMode ? 'text-zinc-400' : 'text-zinc-600'} text-sm font-medium mb-3`}>Gear</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getDisplayData()}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis 
                  domain={[0, 8]}
                  stroke={darkMode ? '#52525b' : '#a1a1aa'}
                  tick={{ fontSize: 12, fill: darkMode ? '#71717a' : '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#18181b' : '#ffffff', 
                    border: darkMode ? '1px solid #3f3f46' : '1px solid #e4e4e7',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value) => [`Gear ${value}`, 'Gear']}
                />
                {bestLapData.length > 0 && (
                  <Line
                    type="step"
                    data={bestLapData}
                    dataKey="gear"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                <Line 
                  type="step" 
                  dataKey="gear" 
                  stroke="#eab308" 
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
