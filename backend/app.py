from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "postgresql://postgres:Kemal2026_31@db.fpvazvcetymcoszuhptw.supabase.co:5432/postgres"

def get_db():
    return psycopg2.connect(DATABASE_URL)

class FiltreRequest(BaseModel):
    lig: Optional[str] = None
    ev_sahibi: Optional[str] = None
    deplasman: Optional[str] = None
    acilis_1_min: Optional[float] = None
    acilis_1_max: Optional[float] = None
    acilis_0_min: Optional[float] = None
    acilis_0_max: Optional[float] = None
    acilis_2_min: Optional[float] = None
    acilis_2_max: Optional[float] = None

@app.get("/")
def ana_sayfa():
    return {"mesaj": "TahminApp Backend API", "durum": "çalışıyor"}

@app.post("/filtrele")
def filtrele(req: FiltreRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM maclar WHERE 1=1'
    params = []
    
    if req.lig:
        query += ' AND "Lig" = %s'
        params.append(req.lig)
    
    if req.ev_sahibi:
        query += ' AND "Ev Sahibi" = %s'
        params.append(req.ev_sahibi)
    
    if req.deplasman:
        query += ' AND "Deplasman" = %s'
        params.append(req.deplasman)
    
    if req.acilis_1_min and req.acilis_1_max:
        query += ' AND "Bet365 Açılış 1" BETWEEN %s AND %s'
        params.extend([req.acilis_1_min, req.acilis_1_max])
    
    if req.acilis_0_min and req.acilis_0_max:
        query += ' AND "Bet365 Açılış 0" BETWEEN %s AND %s'
        params.extend([req.acilis_0_min, req.acilis_0_max])
    
    if req.acilis_2_min and req.acilis_2_max:
        query += ' AND "Bet365 Açılış 2" BETWEEN %s AND %s'
        params.extend([req.acilis_2_min, req.acilis_2_max])
    
    cursor.execute(query, params)
    
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    sonuclar = [dict(zip(columns, row)) for row in rows]
    
    conn.close()
    
    return {
        "toplam": len(sonuclar),
        "maclar": sonuclar
    }

@app.get("/test")
def test_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM maclar")
    toplam = cursor.fetchone()[0]
    conn.close()
    return {"veritabani": "PostgreSQL", "toplam_mac": toplam}