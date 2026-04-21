"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const initialNodes = [
  { id: "vocals", label: "Vokal", color: "bg-pink-500", defaultX: 0, defaultY: -80 },
  { id: "drums", label: "Bateri", color: "bg-blue-500", defaultX: 0, defaultY: 80 },
  { id: "bass", label: "Bas", color: "bg-purple-500", defaultX: -60, defaultY: 0 },
  { id: "other", label: "Diğer", color: "bg-green-500", defaultX: 60, defaultY: 0 },
];

export default function MixerPanel({ stemUrls }: { stemUrls: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const buffers = useRef<Record<string, AudioBuffer>>({});
  const chains = useRef<Record<string, { gain: GainNode, panner: PannerNode, source?: AudioBufferSourceNode }>>({});

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [resetKey, setResetKey] = useState(0); 
  const [volumes, setVolumes] = useState<Record<string, number>>({
    vocals: 0.8, drums: 0.8, bass: 0.8, other: 0.8
  });

  const [mutes, setMutes] = useState<Record<string, boolean>>({});
  const [solos, setSolos] = useState<Record<string, boolean>>({});

  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const initAudio = async () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const entries = Object.entries(stemUrls);
    const fetchedBuffers = await Promise.all(entries.map(async ([id, url]) => {
      const res = await fetch(`${url}?t=${Date.now()}`);
      const arr = await res.arrayBuffer();
      return await audioCtx.current!.decodeAudioData(arr);
    }));

    let maxDuration = 0;
    entries.forEach(([id], i) => {
      const buffer = fetchedBuffers[i];
      buffers.current[id] = buffer;
      if (buffer.duration > maxDuration) maxDuration = buffer.duration;

      const gain = audioCtx.current!.createGain();
      const panner = audioCtx.current!.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.rolloffFactor = 0;
      gain.gain.value = volumes[id];

      gain.connect(panner).connect(audioCtx.current!.destination);
      chains.current[id] = { gain, panner };
    });

    setDuration(maxDuration);
    setIsReady(true);
  };

  const animateProgress = () => {
    if (!audioCtx.current || !isPlayingRef.current) return;
    
    const elapsed = audioCtx.current.currentTime - startTimeRef.current;
    
    if (elapsed >= duration) {
      pauseAudio();
      setCurrentTime(0);
      pauseTimeRef.current = 0;
      return;
    }
    
    setCurrentTime(elapsed);
    requestRef.current = requestAnimationFrame(animateProgress);
  };

  const playAudio = (offset: number) => {
    Object.keys(buffers.current).forEach(id => {
      if (chains.current[id].source) {
        try { chains.current[id].source!.stop(); } catch(e){}
      }
      const source = audioCtx.current!.createBufferSource();
      source.buffer = buffers.current[id];
      source.connect(chains.current[id].gain);
      source.start(0, offset);
      chains.current[id].source = source;
    });

    startTimeRef.current = audioCtx.current!.currentTime - offset;
    pauseTimeRef.current = offset;
    
    isPlayingRef.current = true;
    setIsPlaying(true);
    cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animateProgress);
  };

  const pauseAudio = () => {
    Object.keys(chains.current).forEach(id => {
      if (chains.current[id].source) {
        try { chains.current[id].source!.stop(); } catch(e){}
      }
    });
    if (audioCtx.current) {
        pauseTimeRef.current = audioCtx.current.currentTime - startTimeRef.current;
    }
    
    isPlayingRef.current = false;
    setIsPlaying(false);
    cancelAnimationFrame(requestRef.current);
  };

  const togglePlay = async () => {
    if (!isReady) await initAudio();
    if (audioCtx.current?.state === 'suspended') await audioCtx.current.resume();
    isPlayingRef.current ? pauseAudio() : playAudio(pauseTimeRef.current);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    pauseTimeRef.current = newTime;
    
    if (isPlayingRef.current) {
      pauseAudio();
      playAudio(newTime); 
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDrag = (id: string, info: any) => {
    if (!containerRef.current || !chains.current[id]) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const dropX = info.point.x - centerX;
    const dropY = info.point.y - centerY;
    const normX = Math.max(-1, Math.min(1, dropX / (bounds.width / 2)));
    const normY = Math.max(-1, Math.min(1, dropY / (bounds.height / 2)));

    chains.current[id].panner.positionX.value = normX * 3;
    chains.current[id].panner.positionZ.value = normY * 3;
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1); 
    Object.values(chains.current).forEach(c => {
      c.panner.positionX.value = 0;
      c.panner.positionZ.value = 0;
    });
  };

  const toggleMute = (id: string) => setMutes(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSolo = (id: string) => setSolos(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const isAnySoloActive = Object.values(solos).some(v => v);

    Object.entries(volumes).forEach(([id, vol]) => {
      if (chains.current[id]) {
        let targetVolume = vol;

        if (isAnySoloActive) {
          targetVolume = solos[id] ? vol : 0;
        } else if (mutes[id]) {
          targetVolume = 0;
        }

        chains.current[id].gain.gain.value = targetVolume;
      }
    });
  }, [volumes, mutes, solos]);

  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl gap-8">
      <div className="flex flex-col w-full bg-[#1e1e1e] p-6 rounded-3xl border border-gray-800 shadow-xl gap-4">
        <div className="flex items-center justify-between gap-6">
          <button 
            onClick={togglePlay}
            className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-lg text-white font-bold text-xl ${isPlaying ? 'bg-red-500 shadow-red-500/20' : 'bg-green-600 shadow-green-500/20'}`}
          >
            {isPlaying ? "||" : "▶"}
          </button>

          <div className="flex-grow flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input 
              type="range" min="0" max={duration || 100} step="0.1"
              value={currentTime}
              onChange={handleSeek}
              disabled={!isReady && !isPlaying}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 disabled:opacity-50"
            />
          </div>

          <button 
            onClick={handleReset}
            className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl text-sm font-bold border border-gray-700 transition-all active:scale-95"
          >
            Konumları Ortala
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full">
        <div ref={containerRef} className="relative w-72 h-[450px] border-2 border-gray-700 rounded-[3rem] bg-[#161616] flex items-center justify-center overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          {initialNodes.map((node) => (
            <motion.div
              key={`${node.id}-${resetKey}`}
              drag
              dragConstraints={containerRef}
              dragMomentum={false}
              onDrag={(e, info) => handleDrag(node.id, info)}
              initial={{ x: node.defaultX, y: node.defaultY }}
              className={`absolute w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl ${node.color} border-2 border-white/20 z-10`}
              style={{ opacity: (mutes[node.id] || (Object.values(solos).some(v=>v) && !solos[node.id])) ? 0.2 : volumes[node.id] + 0.2 }}
            >
              <span className="text-[10px] font-black text-white uppercase">{node.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-4 bg-[#1e1e1e] p-8 rounded-3xl border border-gray-800 w-full max-w-sm shadow-2xl">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Kanal Kontrolleri</h3>
          {initialNodes.map((node) => (
            <div key={node.id} className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-300 font-bold">{node.label}</span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleMute(node.id)}
                    className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-[10px] transition-all ${mutes[node.id] ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                  >
                    M
                  </button>
                  <button 
                    onClick={() => toggleSolo(node.id)}
                    className={`w-6 h-6 flex items-center justify-center rounded-md font-bold text-[10px] transition-all ${solos[node.id] ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                  >
                    S
                  </button>
                </div>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01"
                value={volumes[node.id]}
                onChange={(e) => setVolumes({...volumes, [node.id]: parseFloat(e.target.value)})}
                className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:opacity-30 ${solos[node.id] ? 'accent-yellow-500' : 'accent-blue-500'}`}
                disabled={mutes[node.id] || (Object.values(solos).some(v=>v) && !solos[node.id])}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}