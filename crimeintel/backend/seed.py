import json
import os
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import PoliceStation, CaseMaster, FIR, Person, Vehicle, EntityRelationship
from sqlalchemy import text

# Ensure vector extension is installed
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.commit()

# Create tables
Base.metadata.create_all(bind=engine)

def load_json(filename):
    path = os.path.join("public", "seed", filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def seed_database():
    db: Session = SessionLocal()
    
    print("Seeding Police Stations...")
    ps_data = load_json("PoliceStations.json")
    for ps in ps_data:
        if not db.query(PoliceStation).filter(PoliceStation.id == ps.get("id")).first():
            station = PoliceStation(
                id=ps.get("id"),
                name_en=ps.get("name_en"),
                name_kn=ps.get("name_kn"),
                district_id=ps.get("district_id"),
                latitude=ps.get("lat"),
                longitude=ps.get("lng")
            )
            db.add(station)
    db.commit()

    print("Seeding FIRs and Cases...")
    fir_data = load_json("FIRs.json")
    added_cases = set()
    for fir_row in fir_data:
        case_id = fir_row.get("case_no") or fir_row.get("id")
        if case_id not in added_cases:
            if not db.query(CaseMaster).filter(CaseMaster.id == case_id).first():
                case = CaseMaster(
                    id=case_id,
                    case_status=fir_row.get("status_en", "Pending"),
                    investigating_officer="Unknown"
                )
                db.add(case)
            added_cases.add(case_id)
            
        if not db.query(FIR).filter(FIR.id == fir_row.get("id")).first():
            fir = FIR(
                id=fir_row.get("id"),
                case_master_id=case_id,
                ps_id=fir_row.get("police_station_id"),
                fir_no=fir_row.get("fir_no"),
                year=int(fir_row.get("date", "2024").split("-")[0]) if fir_row.get("date") else 2024,
                crime_type_en=fir_row.get("crime_type_en"),
                crime_type_kn=fir_row.get("crime_type_kn"),
                status_en=fir_row.get("status_en"),
                brief_fact_en=fir_row.get("description")
            )
            db.add(fir)
    db.commit()

    print("Seeding Persons...")
    person_data = load_json("Persons.json")
    added_persons = set()
    for p_row in person_data:
        person_id = p_row.get("id")
        if person_id not in added_persons:
            if not db.query(Person).filter(Person.id == person_id).first():
                person = Person(
                    id=person_id,
                    fir_id=p_row.get("fir_id") or p_row.get("source_fir") or "FIR_1",
                    role="ACCUSED" if p_row.get("type") == "Suspect" else "WITNESS",
                    name_en=p_row.get("name_en") or p_row.get("title"),
                    name_kn=p_row.get("name_kn"),
                    age=p_row.get("age", 30),
                    gender=p_row.get("gender"),
                    address=p_row.get("address"),
                    phone_number=p_row.get("phone")
                )
                db.add(person)
            added_persons.add(person_id)
    db.commit()

    print("Seeding Complete!")

if __name__ == "__main__":
    seed_database()
