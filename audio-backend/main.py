import sys
import os
import shutil
import glob
import subprocess
import uuid
import sqlite3
import hashlib
import secrets
from datetime import datetime
from enum import Enum
from typing import Dict, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

os.environ["PATH"] += os.pathsep + os.getcwd()
os.environ["TORCHAUDIO_BACKEND"] = "soundfile"

app = FastAPI(title="Spatial Audio Engine - RPi5 Edition")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

OUTPUT_DIR = "output_stems"
UPLOAD_DIR = "temp_uploads"
TEMP_PROCESS_DIR = "temp_processing"
DB_FILE = "spatial_audio.db" 

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, model TEXT, folder_name TEXT, date TEXT)''')
    conn.commit()
    conn.close()

init_db()

class ModelChoice(str, Enum):
    spleeter_fast = "spleeter:4stems"
    demucs_hq = "htdemucs"
    demucs_extra = "mdx_extra"

class UserAuth(BaseModel):
    username: str
    password: str

progress_store: Dict[str, str] = {"status": "Sistem Hazır"}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Yetkisiz erişim. Lütfen giriş yapın.")
    token = authorization.split(" ")[1]
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT user_id FROM sessions WHERE token=?", (token,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=401, detail="Geçersiz oturum.")
    return row[0]

@app.post("/register")
def register(user: UserAuth):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user.username, hash_password(user.password)))
        conn.commit()
        return {"status": "success", "message": "Kayıt başarılı! Giriş yapabilirsiniz."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")
    finally:
        conn.close()

@app.post("/login")
def login(user: UserAuth):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE username=? AND password=?", (user.username, hash_password(user.password)))
    row = c.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=401, detail="Hatalı kullanıcı adı veya şifre.")
    
    user_id = row[0]
    token = secrets.token_hex(32) 
    
    c.execute("DELETE FROM sessions WHERE user_id=?", (user_id,))
    c.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "token": token, "username": user.username}

@app.get("/progress")
def get_progress():
    return {"log": progress_store.get("status", "")}

@app.get("/history")
def get_history(authorization: Optional[str] = Header(None)):
    user_id = get_current_user(authorization)
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT name, model, folder_name, date FROM songs WHERE user_id=? ORDER BY id DESC", (user_id,))
    rows = c.fetchall()
    conn.close()
    
    history_list = []
    for name, model, folder_name, date_str in rows:
        stems = ["vocals", "drums", "bass", "other"]
        # YENİ: Localhost yerine evrensel bağ (relative path) kullanıyoruz
        urls = {stem: f"/outputs/{folder_name}/{model}/{stem}.wav" for stem in stems}
        history_list.append({
            "name": name,
            "model": model,
            "date": date_str,
            "urls": urls
        })
        
    return {"history": history_list}

@app.post("/separate")
async def separate_audio(
    file: UploadFile = File(...), 
    model: ModelChoice = Form(ModelChoice.demucs_hq),
    authorization: Optional[str] = Header(None)
):
    user_id = get_current_user(authorization)
    progress_store["status"] = "Dosya alınıyor ve hazırlanıyor..."
    
    original_name = os.path.splitext(file.filename)[0]
    safe_song_name = original_name.replace(" ", "_").lower()
    date_str = datetime.now().strftime("%d%m%y_%H%M%S")
    
    model_folder_name = model.value.split(":")[-1] if ":" in model.value else model.value
    main_archive_dir = f"{safe_song_name}_{user_id}_{date_str}" 
    
    main_path = os.path.join(OUTPUT_DIR, main_archive_dir)
    final_path = os.path.join(main_path, model_folder_name)
    os.makedirs(final_path, exist_ok=True)

    temp_input = os.path.join(UPLOAD_DIR, file.filename)
    with open(temp_input, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    original_file_dest = os.path.join(main_path, f"original_{file.filename}")
    if not os.path.exists(original_file_dest):
        shutil.copy2(temp_input, original_file_dest)

    temp_out = os.path.join(TEMP_PROCESS_DIR, str(uuid.uuid4()))
    
    try:
        progress_store["status"] = "Yapay Zeka Motoru Başlatılıyor..."
        
        if "spleeter" in model.value:
            cmd = [sys.executable, "-m", "spleeter", "separate", "-p", model.value, "-o", temp_out, temp_input]
        else:
            cmd = [sys.executable, "-m", "demucs", "-n", model.value, "-o", temp_out, temp_input]
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace', bufsize=1)
        
        buf = ""
        while True:
            char = process.stdout.read(1)
            if not char and process.poll() is not None:
                break
            if char in ['\r', '\n']:
                clean_line = buf.strip()
                if clean_line:
                    print(clean_line, flush=True) 
                    progress_store["status"] = clean_line
                buf = "" 
            else:
                buf += char 
            
        process.wait()

        if process.returncode != 0:
            progress_store["status"] = "Hata! İşlem Çöktü."
            raise HTTPException(status_code=500, detail=f"Analiz çöktü (Kodu: {process.returncode}).")

        progress_store["status"] = "Dosyalar arşive taşınıyor... (100%)"
        wav_files = glob.glob(os.path.join(temp_out, "**", "*.wav"), recursive=True)
        if not wav_files:
            raise HTTPException(status_code=500, detail="İşlem bitti ama .wav dosyaları bulunamadı.")

        for wav_path in wav_files:
            shutil.move(wav_path, os.path.join(final_path, os.path.basename(wav_path)))
            
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO songs (user_id, name, model, folder_name, date) VALUES (?, ?, ?, ?, ?)", 
                  (user_id, original_name.capitalize(), model_folder_name, main_archive_dir, date_str))
        conn.commit()
        conn.close()
            
        progress_store["status"] = "Analiz Başarıyla Tamamlandı!"

    finally:
        if os.path.exists(temp_input): os.remove(temp_input)
        if os.path.exists(temp_out): shutil.rmtree(temp_out)

    return {
        "status": "success",
        "song": original_name,
        "model_used": model_folder_name,
        # YENİ: Relative path dönüşü
        "urls": {stem: f"/outputs/{main_archive_dir}/{model_folder_name}/{stem}.wav" for stem in ["vocals", "drums", "bass", "other"]}
    }