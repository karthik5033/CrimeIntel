from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import get_db, Base, engine
from backend.models import FIR, Person, CaseMaster

# Create tables if not exists
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CrimeIntel FastAPI", description="PostgreSQL backed API for CrimeIntel")

# Allow Next.js frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "database": "connected"}

@app.get("/api/v1/cases")
def get_cases(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    cases = db.query(FIR).offset(skip).limit(limit).all()
    # Simple serialization for demonstration
    return [{
        "id": c.id,
        "fir_no": c.fir_no,
        "year": c.year,
        "crime_type_en": c.crime_type_en,
        "status_en": c.status_en,
        "ps_id": c.ps_id
    } for c in cases]

@app.get("/api/v1/cases/{fir_id}")
def get_case(fir_id: str, db: Session = Depends(get_db)):
    case = db.query(FIR).filter(FIR.id == fir_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    persons = db.query(Person).filter(Person.fir_id == fir_id).all()
    
    return {
        "id": case.id,
        "fir_no": case.fir_no,
        "crime_type_en": case.crime_type_en,
        "status_en": case.status_en,
        "brief_fact_en": case.brief_fact_en,
        "involved_persons": [{
            "id": p.id,
            "name": p.name_en,
            "role": p.role,
            "age": p.age
        } for p in persons]
    }

@app.get("/api/v1/persons")
def get_persons(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    persons = db.query(Person).offset(skip).limit(limit).all()
    return [{
        "id": p.id,
        "name": p.name_en,
        "role": p.role,
        "fir_id": p.fir_id
    } for p in persons]

from pydantic import BaseModel
from backend.ai_service import generate_embedding, generate_chat_response

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    sessionId: str

@app.post("/api/v1/chat")
def chat_with_data(req: ChatRequest, db: Session = Depends(get_db)):
    query = req.message.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty query")

    # 1. Embed the user's query
    query_embedding = generate_embedding(query)

    # 2. Vector Search for relevant FIRs (Cosine Distance)
    # Using pgvector's l2_distance (<->) or cosine_distance (<=>)
    # We will use cosine distance and order by it
    relevant_firs = db.query(FIR).order_by(FIR.embedding.cosine_distance(query_embedding)).limit(5).all()

    # 3. Build RAG Context
    vector_data = []
    for fir in relevant_firs:
        # Fetch related persons to add to context
        persons = db.query(Person).filter(Person.fir_id == fir.id).all()
        person_details = [f"{p.name_en} ({p.role})" for p in persons]
        
        vector_data.append({
            "fir_no": fir.fir_no,
            "crime_type": fir.crime_type_en,
            "status": fir.status_en,
            "snippet": fir.brief_fact_en,
            "involved": person_details
        })

    rag_context = [{
        "source": "VectorAgent",
        "data": vector_data
    }]

    # 4. Construct LLM Prompt
    system_prompt = """You are an AI intelligence assistant for Karnataka State Police CrimeIntel system.
Your role:
- Analyze FIR data from Karnataka State Police databases
- Identify crime patterns, suspect connections, and investigative leads
- Summarize complex intelligence data in clear, actionable insights
Guidelines:
- Be concise but thorough.
- Highlight key FIR numbers, suspect names, and location patterns.
- ONLY answer based on the provided RAG context. Do not make up cases.
- If the RAG context contains nothing relevant to the query, clearly state that no intelligence was found."""

    user_prompt = f"Query: {query}\n\nContext:\n{str(rag_context)}"

    # 5. Generate Final Response
    final_response = generate_chat_response(user_prompt, system_prompt)

    # 6. Format for Next.js UI
    return {
        "text_summary": final_response,
        "rag_context": rag_context,
        "data_table": [item["data"] for item in rag_context]
    }

