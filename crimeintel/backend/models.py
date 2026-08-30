from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import enum
from .database import Base

class RoleEnum(str, enum.Enum):
    ACCUSED = "ACCUSED"
    VICTIM = "VICTIM"
    COMPLAINANT = "COMPLAINANT"
    WITNESS = "WITNESS"

class PoliceStation(Base):
    __tablename__ = "police_stations"
    id = Column(String, primary_key=True, index=True)
    name_en = Column(String)
    name_kn = Column(String)
    district_id = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)

    firs = relationship("FIR", back_populates="police_station")

class CaseMaster(Base):
    __tablename__ = "case_master"
    id = Column(String, primary_key=True, index=True)
    case_status = Column(String)
    investigating_officer = Column(String)
    
    firs = relationship("FIR", back_populates="case_master")

class FIR(Base):
    __tablename__ = "firs"
    id = Column(String, primary_key=True, index=True)
    case_master_id = Column(String, ForeignKey("case_master.id"))
    ps_id = Column(String, ForeignKey("police_stations.id"))
    fir_no = Column(String, index=True)
    year = Column(Integer)
    date_of_registration = Column(DateTime)
    crime_type_en = Column(String)
    crime_type_kn = Column(String)
    status_en = Column(String)
    status_kn = Column(String)
    
    # Text content for AI
    brief_fact_en = Column(Text)
    brief_fact_kn = Column(Text)
    
    # Vector Embeddings for semantic search
    # 3072 dimensions for Gemini
    embedding = Column(Vector(3072))

    case_master = relationship("CaseMaster", back_populates="firs")
    police_station = relationship("PoliceStation", back_populates="firs")
    involved_persons = relationship("Person", back_populates="fir")
    vehicles = relationship("Vehicle", back_populates="fir")

class Person(Base):
    __tablename__ = "persons"
    id = Column(String, primary_key=True, index=True)
    fir_id = Column(String, ForeignKey("firs.id"))
    
    role = Column(Enum(RoleEnum))
    name_en = Column(String)
    name_kn = Column(String)
    age = Column(Integer)
    gender = Column(String)
    address = Column(Text)
    phone_number = Column(String)
    
    # Additional traits
    profession = Column(String)
    
    fir = relationship("FIR", back_populates="involved_persons")
    
class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(String, primary_key=True, index=True)
    fir_id = Column(String, ForeignKey("firs.id"))
    
    registration_no = Column(String, index=True)
    make = Column(String)
    model = Column(String)
    color = Column(String)
    vehicle_type = Column(String)
    
    fir = relationship("FIR", back_populates="vehicles")

class EntityRelationship(Base):
    """
    Graph Edge table representing relationships between any two entities.
    Example: Person (source) --"OWNS"--> Vehicle (target)
    """
    __tablename__ = "entity_relationships"
    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, index=True)
    source_type = Column(String) # e.g., "Person", "FIR", "Vehicle"
    target_id = Column(String, index=True)
    target_type = Column(String)
    relationship_type = Column(String) # e.g., "ACCUSED_IN", "CONTACTED", "OWNS"
    confidence_score = Column(Float, default=1.0)
    metadata_json = Column(JSON, default={})
