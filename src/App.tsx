import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MousePointer2, 
  Keyboard, 
  Gamepad2, 
  Music, 
  Power, 
  Monitor, 
  Smartphone,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  Wifi,
  WifiOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Zap,
  HardDrive,
  Settings,
  Globe,
  Link2,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Mode = 'PC' | 'REMOTE' | 'SELECT';

interface Message {
  type: 'MOUSE_MOVE' | 'MOUSE_CLICK' | 'KEY_PRESS' | 'MEDIA_CMD' | 'POWER_CMD' | 'CURSOR_POS' | 'SYSTEM_STATS';
  payload: any;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('SELECT');
  const [connected, setConnected] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [systemStats, setSystemStats] = useState({ cpu: 0, ram: 0, battery: 100, isCharging: false });
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customIp, setCustomIp] = useState('');
  const [connectionUrl, setConnectionUrl] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const touchpadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'SELECT') return;

    let url = '';
    if (customIp) {
      // Manual IP connection (Local Network)
      url = `ws://${customIp}`;
    } else {
      // Automatic Cloud connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${protocol}//${window.location.host}`;
    }
    
    setConnectionUrl(url);
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const msg: Message = JSON.parse(event.data);
      handleIncomingMessage(msg);
    };

    return () => socket.close();
  }, [mode, customIp]);

  const handleIncomingMessage = (msg: Message) => {
    if (msg.type === 'CURSOR_POS') {
      setCursorPos(msg.payload);
    } else if (msg.type === 'SYSTEM_STATS') {
      setSystemStats(msg.payload);
    } else if (msg.type === 'MEDIA_CMD' || msg.type === 'KEY_PRESS' || msg.type === 'POWER_CMD') {
      setLastAction(`${msg.type}: ${JSON.stringify(msg.payload)}`);
      setTimeout(() => setLastAction(null), 2000);
    }
  };

  const sendMessage = useCallback((msg: Message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const handleTouchpadMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchpadRef.current) return;
    const rect = touchpadRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    sendMessage({ type: 'CURSOR_POS', payload: { x: clampedX, y: clampedY } });
  };

  if (mode === 'SELECT') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0b]">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <MousePointer2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">RemoteLink</h1>
          <p className="text-zinc-500 text-sm">Professional PC Remote Control</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('PC')}
            className="hardware-surface p-12 rounded-3xl flex flex-col items-center gap-6 group transition-all"
          >
            <div className="w-24 h-24 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Monitor className="w-12 h-12 text-blue-500" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">PC Mode</h2>
              <p className="text-zinc-500 text-sm">Receive commands and display cursor</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('REMOTE')}
            className="hardware-surface p-12 rounded-3xl flex flex-col items-center gap-6 group transition-all"
          >
            <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Smartphone className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-white">Remote Mode</h2>
              <p className="text-zinc-500 text-sm">Control your PC from this device</p>
            </div>
          </motion.button>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="mt-12 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Connection Settings
        </button>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="hardware-surface w-full max-w-md rounded-3xl p-8 relative"
              >
                <button 
                  onClick={() => setShowSettings(false)}
                  className="absolute top-6 right-6 text-zinc-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Link2 className="w-6 h-6 text-blue-500" />
                  Connection Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Manual IP Connection</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="e.g. 192.168.1.10:3000"
                        value={customIp}
                        onChange={(e) => setCustomIp(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2 flex items-start gap-2">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      Use this to connect to a server running on your local network (offline mode). Leave empty for cloud mode.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">How to use offline:</h4>
                    <ol className="text-[10px] text-zinc-400 space-y-2 list-decimal ml-4">
                      <li>Host this app's server on your PC locally.</li>
                      <li>Ensure your phone and PC are on the same Wi-Fi.</li>
                      <li>Enter your PC's local IP address above.</li>
                    </ol>
                  </div>

                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Save & Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-white font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0e11]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MousePointer2 className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">RemoteLink</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono ${connected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <button 
            onClick={() => setMode('SELECT')}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-8">
        {mode === 'PC' ? (
          <div className="h-full flex flex-col items-center justify-center relative">
            <div className="w-full max-w-5xl aspect-video hardware-surface rounded-2xl relative overflow-hidden bg-black/40 border border-white/10">
              {/* Virtual Cursor */}
              <motion.div 
                animate={{ x: `${cursorPos.x}%`, y: `${cursorPos.y}%` }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute w-6 h-6 -ml-3 -mt-3 pointer-events-none z-50"
              >
                <MousePointer2 className="w-full h-full text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </motion.div>

              {/* PC Content Simulation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 select-none">
                <Monitor className="w-32 h-32 mb-4" />
                <p className="font-mono text-sm tracking-widest">AWAITING INPUT...</p>
                <div className="mt-4 px-4 py-2 bg-white/5 rounded-lg border border-white/5 font-mono text-[10px] text-zinc-500">
                  WS: {connectionUrl}
                </div>
              </div>

              {/* Action Toast */}
              <AnimatePresence>
                {lastAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-2 rounded-lg font-mono text-xs shadow-xl"
                  >
                    {lastAction}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-8 text-center">
              <h1 className="text-xl font-medium text-zinc-400">PC Receiver Active</h1>
              <p className="text-zinc-600 text-sm mt-1">Open RemoteLink on your phone to control this screen</p>
            </div>
          </div>
        ) : (
          <div className="h-full max-w-md mx-auto flex flex-col gap-6">
            {/* System Health Dashboard */}
            <div className="grid grid-cols-3 gap-4">
              <div className="hardware-surface p-4 rounded-2xl flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full mb-1">
                  <Cpu className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-mono text-zinc-500">CPU</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">{systemStats.cpu}%</div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    animate={{ width: `${systemStats.cpu}%` }}
                    className={`h-full ${systemStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                  />
                </div>
              </div>

              <div className="hardware-surface p-4 rounded-2xl flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full mb-1">
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-mono text-zinc-500">RAM</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">{systemStats.ram}%</div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    animate={{ width: `${systemStats.ram}%` }}
                    className={`h-full ${systemStats.ram > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                  />
                </div>
              </div>

              <div className="hardware-surface p-4 rounded-2xl flex flex-col items-center gap-2">
                <div className="flex items-center justify-between w-full mb-1">
                  <Zap className={`w-3 h-3 ${systemStats.isCharging ? 'text-yellow-400 animate-pulse' : 'text-amber-400'}`} />
                  <span className="text-[10px] font-mono text-zinc-500">BAT</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">{systemStats.battery}%</div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    animate={{ width: `${systemStats.battery}%` }}
                    className={`h-full ${systemStats.battery < 20 ? 'bg-red-500' : 'bg-amber-500'}`} 
                  />
                </div>
              </div>
            </div>

            {/* Touchpad Area */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Precision Touchpad</span>
                <Maximize className="w-3 h-3 text-zinc-500" />
              </div>
              <div 
                ref={touchpadRef}
                onMouseMove={handleTouchpadMove}
                onTouchMove={handleTouchpadMove}
                className="flex-1 hardware-surface rounded-3xl relative overflow-hidden cursor-none active:border-blue-500/50 transition-colors"
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                  <MousePointer2 className="w-12 h-12" />
                </div>
              </div>
            </div>

            {/* Media Controls */}
            <div className="hardware-surface p-6 rounded-3xl flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Music className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Now Playing</div>
                    <div className="text-[10px] text-zinc-500 font-mono">System Audio</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-blue-500" />
                  </div>
                  <Volume2 className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                <button 
                  onClick={() => sendMessage({ type: 'MEDIA_CMD', payload: 'prev' })}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => sendMessage({ type: 'MEDIA_CMD', payload: 'play_pause' })}
                  className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={() => sendMessage({ type: 'MEDIA_CMD', payload: 'next' })}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Keyboard, label: 'Keys', color: 'text-amber-400' },
                { icon: Gamepad2, label: 'Game', color: 'text-emerald-400' },
                { icon: Monitor, label: 'Screen', color: 'text-purple-400' },
                { icon: Power, label: 'Power', color: 'text-red-400' }
              ].map((item, i) => (
                <button 
                  key={i}
                  className="hardware-surface aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-[10px] font-medium text-zinc-500">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Status */}
      <footer className="h-10 border-t border-white/5 bg-[#0d0e11] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-zinc-600 uppercase">Mode: {customIp ? 'Local' : 'Cloud'}</span>
          <span className="text-[10px] font-mono text-zinc-600">LATENCY: 12MS</span>
        </div>
        <div className="text-[10px] font-mono text-blue-500/50">v1.0.4-STABLE</div>
      </footer>
    </div>
  );
}
