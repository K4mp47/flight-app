import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-jwt-secret")
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]
    DB_URL = os.getenv("DB_URL")
