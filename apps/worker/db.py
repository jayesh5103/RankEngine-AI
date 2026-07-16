from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

# Initialize motor client
client = AsyncIOMotorClient(settings.MONGODB_URI)

# Retrieve default database (e.g. "rankengine" parsed from connection string)
db = client.get_default_database()
