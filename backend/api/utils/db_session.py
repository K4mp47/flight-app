from contextlib import contextmanager
from db import SessionLocal

@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
