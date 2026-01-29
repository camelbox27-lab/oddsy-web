from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import List, Optional

app = FastAPI()

# CORS ayarları (Frontend'den istek alabilmek için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da frontend URL'ini yaz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanı bağlantısı
def get_db():
    conn = sqlite3.connect('finalveri.db')
    conn.row_factory = sqlite3.Row
    return conn

# İstek modeli
class FiltreRequest(BaseModel):
    ev_sahibi: str
    deplasman: str
    acilis_1: float
    kapanis_1: float
    acilis_0: float
    kapanis_0: float
    acilis_2: float
    kapanis_2: float

@app.get("/")
def ana_sayfa():
    return {"mesaj": "TahminApp Backend API", "durum": "çalışıyor"}

@app.post("/filtrele")
def filtrele(req: FiltreRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    # TAM EŞLEŞME sorgusu
    query = """
    SELECT * FROM maclar 
    WHERE "Ev Sahibi" = ? 
    AND "Deplasman" = ?
    AND "Bet365 Açılış 1" = ?
    AND "Bet365 Kapanış 1" = ?
    AND "Bet365 Açılış 0" = ?
    AND "Bet365 Kapanış 0" = ?
    AND "Bet365 Açılış 2" = ?
    AND "Bet365 Kapanış 2" = ?
    """
    
    cursor.execute(query, (
        req.ev_sahibi,
        req.deplasman,
        req.acilis_1,
        req.kapanis_1,
        req.acilis_0,
        req.kapanis_0,
        req.acilis_2,
        req.kapanis_2
    ))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Sonuçları dict'e çevir
    sonuclar = [dict(row) for row in rows]
    
    return {
        "toplam": len(sonuclar),
        "maclar": sonuclar
    }

@app.get("/test")
def test_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as toplam FROM maclar")
    toplam = cursor.fetchone()[0]
    conn.close()
    return {"veritabani": "bağlandı", "toplam_mac": toplam}
