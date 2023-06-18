from pymongo import MongoClient
import os


def get_mongo_db():
    # Provide the mongodb atlas url to connect python to mongodb using pymongo
    connection_string = os.environ.get('MONGO_DB_CONNECTION_STRING')
    database_name = os.environ.get('MONGO_DB_NAME')
    # Create a connection using MongoClient
    client = MongoClient(connection_string)
    # Debugging
    print("Connected to MongoDB successfully!")
    return client[database_name]