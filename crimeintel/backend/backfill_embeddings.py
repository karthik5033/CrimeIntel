import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import FIR
from backend.ai_service import generate_embedding
import time

def backfill():
    db: Session = SessionLocal()
    
    # Find all FIRs where embedding is None
    # pgvector initially sets it to NULL if not provided
    firs = db.query(FIR).filter(FIR.embedding == None).all()
    
    print(f"Found {len(firs)} FIRs needing embeddings.")
    
    count = 0
    for fir in firs:
        # Fetch related police station to include location data
        ps_name = "Unknown"
        district = "Unknown"
        if fir.police_station:
            ps_name = fir.police_station.name_en or "Unknown"
            district = fir.police_station.district_id or "Unknown"
            
        # Create a rich text representation for embedding
        text_to_embed = f"Case No: {fir.fir_no}. Crime Type: {fir.crime_type_en}. Status: {fir.status_en}. District: {district}. Police Station: {ps_name}. Facts: {fir.brief_fact_en or ''}"
        
        print(f"Generating embedding for {fir.id}...")
        emb = generate_embedding(text_to_embed)
        
        fir.embedding = emb
        count += 1
        
        # Sleep slightly to avoid hitting Gemini rate limits on free tier
        time.sleep(1)
        
        if count % 10 == 0:
            db.commit()
            print(f"Committed {count} embeddings so far...")
            
    db.commit()
    print(f"Successfully backfilled {count} embeddings.")

if __name__ == "__main__":
    backfill()
