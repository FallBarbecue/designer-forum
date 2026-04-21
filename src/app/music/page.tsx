"use client";
import { useState, useEffect } from "react";
import MixerPanel from "@/components/MixerPanel";

export default function SpatialAudioPage() {
  // YENİ: Raspberry Pi'nin IP'sini otomatik algılayan mimari
  const getApiUrl = () => {
    return typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';
  };

  const [step, setStep] = useState(0); 
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState("htdemucs");
  const [loading, setLoading] = useState(false);
  const [progressLog, setProgressLog] = useState("");
  const [progressPercent, setProgressPercent] = useState(0); 
  const [stems, setStems] = useState<any>(null);
  const [songInfo, setSongInfo] = useState<{name: string, model: string} | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem("sa_token");
    const savedUser = localStorage.getItem("sa_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsername(savedUser);
      setStep(1);
    }
  }, []);

  useEffect(() => {
    if (token && step === 1) fetchHistory();
  }, [token, step]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authMode === "login" ? "login" : "register";
    try {
      const res = await fetch(`${getApiUrl()}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (authMode === "login") {
          localStorage.setItem("sa_token", data.token);
          localStorage.setItem("sa_user", data.username);
          setToken(data.token);
          setUsername(data.username);
          setStep(1);
        } else {
          alert("Kayıt başarılı! Lütfen giriş yapın.");
          setAuthMode("login");
        }
      } else {
        alert("Hata: " + data.detail);
      }
    } catch (err) {
      alert("Sunucuya ulaşılamıyor.");
    }
  };

  const logout = () => {
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_user");
    setToken(null);
    setUsername("");
    setStep(0);
    setHistory([]);
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      } else if (res.status === 401) {
        logout();
      }
    } catch (e) {
      console.log("Arşiv çekilemedi.");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;

    setLoading(true);
    setProgressLog("Hazırlanıyor...");
    setProgressPercent(0);
    
    const logInterval = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/progress`);
        const data = await res.json();
        if(data.log) {
          setProgressLog(data.log);
          const match = data.log.match(/(\d+)%/);
          if (match) setProgressPercent(parseInt(match[1], 10));
        }
      } catch (err) {}
    }, 500);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", model);

    try {
      const response = await fetch(`${getApiUrl()}/separate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok && data.status === "success") {
        setProgressPercent(100);
        
        // YENİ: Esnek dosya yollarını API bağlantısıyla birleştir
        const fullUrls: any = {};
        Object.keys(data.urls).forEach(key => fullUrls[key] = getApiUrl() + data.urls[key]);
        
        setStems(fullUrls);
        setSongInfo({ name: data.song, model: data.model_used });
        setTimeout(() => setStep(2), 1000); 
        fetchHistory(); 
      } else {
        alert("Sunucu Hatası: " + (data.detail || "Bilinmeyen hata"));
        if(response.status === 401) logout();
        setLoading(false);
      }
    } catch (error) {
      alert("Bağlantı Hatası: Python sunucusuna ulaşılamıyor.");
      setLoading(false);
    } finally {
      clearInterval(logInterval);
    }
  };

  const loadFromHistory = (item: any) => {
    // YENİ: Esnek dosya yollarını API bağlantısıyla birleştir
    const fullUrls: any = {};
    Object.keys(item.urls).forEach(key => fullUrls[key] = getApiUrl() + item.urls[key]);
    
    setStems(fullUrls);
    setSongInfo({ name: item.name, model: item.model });
    setStep(2);
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-10 flex flex-col items-center">
      
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-wide">Uzamsal Ses Mikseri</h1>
          <p className="text-gray-400 text-sm">Yapay Zeka Destekli 3D Ses Konumlandırma</p>
        </div>
        {token && (
          <div className="flex items-center gap-4 bg-[#1e1e1e] px-4 py-2 rounded-full border border-gray-800">
            <span className="text-sm text-green-400 font-bold">👤 {username}</span>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">Çıkış Yap</button>
          </div>
        )}
      </div>
      
      {step === 0 && (
        <div className="flex flex-col items-center bg-[#1e1e1e] p-10 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md mt-10">
          <h2 className="text-2xl font-bold text-white mb-6">
            {authMode === "login" ? "Sisteme Giriş" : "Yeni Hesap Oluştur"}
          </h2>
          <form onSubmit={handleAuth} className="flex flex-col gap-4 w-full">
            <input 
              type="text" placeholder="Kullanıcı Adı" required
              value={authUsername} onChange={e => setAuthUsername(e.target.value)}
              className="bg-[#2a2a2a] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white w-full"
            />
            <input 
              type="password" placeholder="Şifre" required
              value={authPassword} onChange={e => setAuthPassword(e.target.value)}
              className="bg-[#2a2a2a] p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white w-full"
            />
            <button type="submit" className="bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-all mt-2 shadow-lg">
              {authMode === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </button>
          </form>
          <button 
            onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
            className="mt-6 text-sm text-gray-500 hover:text-white"
          >
            {authMode === "login" ? "Hesabın yok mu? Kayıt ol." : "Zaten hesabın var mı? Giriş yap."}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-start justify-center">
          <div className="flex flex-col gap-6 bg-[#1e1e1e] p-8 rounded-2xl w-full lg:w-1/2 border border-gray-800 shadow-2xl relative">
            
            {loading && (
              <div className="absolute inset-0 z-50 bg-[#1e1e1e]/90 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="relative flex items-center justify-center">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700" />
                    <circle 
                      cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="text-green-500 transition-all duration-500 ease-out" 
                    />
                  </svg>
                  <span className="absolute text-xl font-bold text-green-400">{progressPercent}%</span>
                </div>
                <p className="mt-4 text-xs font-mono text-gray-400 text-center px-6 truncate w-full">{progressLog}</p>
              </div>
            )}

            <h2 className="text-xl font-bold text-white mb-2">Yeni Analiz</h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <input 
                  type="file" accept="audio/mp3, audio/wav" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer text-sm text-gray-300 w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <select 
                  value={model} onChange={(e) => setModel(e.target.value)}
                  className="bg-[#2a2a2a] p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 border border-gray-700 cursor-pointer"
                >
                  <option value="spleeter:4stems">Spleeter (Hızlı / Taslak)</option>
                  <option value="htdemucs">Demucs HQ (Stüdyo Kalitesi)</option>
                  <option value="mdx_extra">Demucs MDX-Extra (Maks. Kalite)</option>
                </select>
              </div>

              <button 
                type="submit" disabled={!file || loading}
                className="bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                Analizi Başlat
              </button>
            </form>
          </div>

          <div className="flex flex-col bg-[#1e1e1e] p-8 rounded-2xl w-full lg:w-1/2 border border-gray-800 shadow-2xl h-[350px] overflow-hidden flex-shrink-0">
            <h2 className="text-xl font-bold text-white mb-6">Senin Arşivin</h2>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz analiz ettiğin bir şarkı yok.</p>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {history.map((item, idx) => (
                  <button 
                    key={idx} onClick={() => loadFromHistory(item)}
                    className="flex justify-between items-center bg-[#2a2a2a] hover:bg-[#3a3a3a] p-3 rounded-xl transition-all border border-transparent hover:border-gray-600 text-left"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-xs text-gray-400">Mod: {item.model}</span>
                    </div>
                    <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded-full">Yükle</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center bg-[#1e1e1e] p-10 rounded-3xl border border-green-900 shadow-[0_0_50px_rgba(34,197,94,0.1)] w-full max-w-md text-center mt-10">
          <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Analiz Tamamlandı!</h2>
          <p className="text-gray-400 mb-8"><span className="text-white">{songInfo?.name}</span> şarkısı mikslenmeye hazır.</p>
          <button 
            onClick={() => setStep(3)}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-all text-lg shadow-lg"
          >
            Mikser'e Geç
          </button>
          <button onClick={() => {setStep(1); setLoading(false);}} className="mt-4 text-sm text-gray-500 hover:text-white">Geri Dön</button>
        </div>
      )}

      {step === 3 && (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white">3D Ses Stüdyosu</h2>
            <p className="text-gray-400 text-sm">Çalınan Şarkı: {songInfo?.name}</p>
          </div>
          <MixerPanel stemUrls={stems} />
          <button 
            onClick={() => {setStems(null); setFile(null); setStep(1); setLoading(false);}}
            className="mt-12 text-sm text-gray-500 hover:text-white border border-gray-800 px-6 py-2 rounded-full hover:bg-gray-800 transition-all"
          >
            Menüye Dön
          </button>
        </div>
      )}
    </div>
  );
}