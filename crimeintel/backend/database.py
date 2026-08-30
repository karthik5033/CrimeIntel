from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Dependency injection for the database
# We will use PostgreSQL when running locally via Docker
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgrespassword@localhost:5432/crimeintel"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
