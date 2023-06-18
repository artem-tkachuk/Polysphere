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


def check_user_existence(chat_id: int):
    database = get_mongo_db()
    # Get collection
    collection_name = os.environ.get('MONGO_DB_COLLECTION_NAME')
    collection = database[collection_name]
    # get document
    result = collection.find_one({"chat_id": chat_id})
    # return whether the document exists
    return result is not None

# from db.get_user import find_user
import os


# async def new_message_into_history_for_existing_user(chat_id, role, message):
#     # Setup MongoDB to store chat history and user data
#     database = get_mongo_db()
#     # Get collection
#     collection_name = os.environ.get('MONGO_DB_COLLECTION_NAME')
#     collection = database[collection_name]
#     # get user
#     user = await find_user(chat_id)
#     # Add new message
#     user['chats'][-1].append({"role": role, "content": message})
#     # # Store document
#     collection.update_one(
#         {"chat_id": chat_id},
#         {"$set": {"chats": user['chats']}
#      })