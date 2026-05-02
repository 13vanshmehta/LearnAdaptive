import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Change connection string if your MongoDB is hosted (like MongoDB Atlas)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)

# Database Name
db_client = client["llm_learning_db"]

def get_db():
    """Dependency to get MongoDB database instance"""
    try:
        yield db_client
    finally:
        pass
