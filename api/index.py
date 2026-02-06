import sys
import os
sys.path.insert(0, '/var/task')

from mangum import Mangum
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import psycopg2
from typing import Optional

app = FastAPI()

# CORS: Production domainler ile sınırlandır
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://oddsy.vercel.app,https://oddsy-web.vercel.app,https://www.oddsy.com,https://oddsy.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Database URL environment variable'dan al
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Kemal2026_31@db.fpvazvcetymcoszuhptw.supabase.co:5432/postgres"
)

def get_db():
    return psycopg2.connect(DATABASE_URL)

class FiltreRequest(BaseModel):
    lig: Optional[str] = Field(None, max_length=100)
    ev_sahibi: Optional[str] = Field(None, max_length=100)
    deplasman: Optional[str] = Field(None, max_length=100)
    acilis_1: Optional[float] = Field(None, ge=1.0, le=100.0)
    acilis_0: Optional[float] = Field(None, ge=1.0, le=100.0)
    acilis_2: Optional[float] = Field(None, ge=1.0, le=100.0)

@app.get("/")
def ana_sayfa():
    return {"mesaj": "TahminApp Backend API", "durum": "calisiyor"}

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
    
    if req.acilis_1:
        query += ' AND "Bet365 Acilis 1" = %s'
        params.append(req.acilis_1)
    
    if req.acilis_0:
        query += ' AND "Bet365 Acilis 0" = %s'
        params.append(req.acilis_0)
    
    if req.acilis_2:
        query += ' AND "Bet365 Acilis 2" = %s'
        params.append(req.acilis_2)
    
    cursor.execute(query, params)
    
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    sonuclar = [dict(zip(columns, row)) for row in rows]
    
    conn.close()
    
    return {"toplam": len(sonuclar), "maclar": sonuclar}

@app.get("/test")
def test_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM maclar")
    toplam = cursor.fetchone()[0]
    conn.close()
    return {"veritabani": "PostgreSQL", "toplam_mac": toplam}

handler = Mangum(app)