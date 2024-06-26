from dotenv import load_dotenv

load_dotenv()  

from mongo import get_mongo_db
from pymongo import ReturnDocument

from flask import Flask, render_template_string, jsonify, request
import spotipy
from PIL import Image
import requests
from io import BytesIO
import numpy as np
from spotipy.oauth2 import SpotifyOAuth
import os 
from flask_cors import CORS, cross_origin
from embed import embed
import pinecone

app = Flask(__name__)
CORS(app)


scope = "user-library-read user-read-recently-played"

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=scope))


def generate_album_covers_grid(album_covers):
    # Size of each album cover
    cover_size = (200, 200)

    # Number of covers per row
    covers_per_row = 5

    # Create a new image of the correct size
    img_width = cover_size[0] * covers_per_row
    img_height = cover_size[1] * int(np.ceil(len(album_covers) / covers_per_row))
    img = Image.new('RGB', (img_width, img_height))

    # Paste each album cover into the image
    for i, cover_url in enumerate(album_covers):
        # Get the album cover image
        response = requests.get(cover_url)
        cover_img = Image.open(BytesIO(response.content))

        # Resize the cover to the desired size
        cover_img = cover_img.resize(cover_size)

        # Calculate the position of this album cover
        x = (i % covers_per_row) * cover_size[0]
        y = (i // covers_per_row) * cover_size[1]

        # Paste the cover into the image
        img.paste(cover_img, (x, y))

    # Save the image
    img.save('album_covers.png')

@app.route('/get_recommendations_page', methods=['GET'])
def get_recommendations_page(userID, userName, artistName, songName):
    # build a chat interface
    # input song / hardcode
    data = request.get_json()
    userName = data.get('userName')
    artistName = data.get('artistName')
    songName = data.get('songName')
    # get my embedding for this song
    # filter all pinecone vectorIDs by corresponding songname
    # similarity search
    # return as output whatever pinecone gives

@app.route('/emotions', methods=['POST'])
def write_emotions_to_db():
    data = request.get_json()  # This is your payload from the POST request
    print(data)  # This will print the entire JSON payload

    # If you want to access individual values, you can do so like this:
    userID = data.get('userID')
    userName = data.get('userName')
    artistName = data.get('artistName')
    songName = data.get('songName')
    top3Emotions = data.get('top3Emotions')

    print(userID, userName, artistName, songName, top3Emotions)

    # Compute embeddings
    embedding = embed(top3Emotions)

    vectorID = f"{userName}-{artistName.lower().replace(' ', '-')}-{songName.lower().replace(' ', '-')}"

    database = get_mongo_db()
    # Get collection
    collection_name = os.environ.get('MONGO_DB_COLLECTION_NAME')
    songs = database[collection_name]

    print(songs)

    user_doc = {
        'vector_id': vectorID,
        'user_name': userName,
        'artist_name': artistName,
        'userID': userID, 
        'embedding': embedding
    }

    print(user_doc)

    song_doc = songs.find_one_and_update(
        {'song_name': songName, 'artist_name': artistName},
        {'$addToSet': {'users': user_doc}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    print('updated song')

    # Now we need to update the user's embedding if they already exist in the 'users' array
    user_index = next((index for (index, user) in enumerate(song_doc['users']) if user["userID"] == userID), None)

    if user_index is not None:
        songs.update_one(
            {'song_name': songName, 'artist_name': artistName, 'users.userID': userID},
            {'$set': {'users.$.embedding': embedding, 'users.$.vector_id': vectorID}}
        )

        print('updated user')


    ## store embedding in Pinecone
    pinecone.init(
        os.environ.get('PINECONE_API_KEY'),
        environment='us-west1-gcp-free'
    )


    # get index
    index_name = "polysphere-embeddings"

    # indexes_list = pinecone.list_indexes()
    # if index_name not in indexes_list:
    #     pinecone.create_index("polysphere-embeddings", dimension=1536, metric="euclidean")

    index = pinecone.Index(index_name)

    metadata = {
        'user_name': userName,
        'artist_name': artistName,
        'song_name': songName
    }

    # inser embedding for the user into the index for the specific song
    index.upsert([
        (vectorID, embedding, metadata)
    ])    
    

    # TODO query for similarity search
    # index.query(
    #  vector=[0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    #  top_k=3,
    #  include_values=True
    # )

    print('inserted into pinecone')

    # Add your code to write these values to the database


    return {"status": "success"}  # Return a response to indicate the operation was successful


@app.route('/spotify', methods=['GET'])
def home():
    results = sp.current_user_recently_played(limit=50)

    album_covers = []
    track_info = []
    
    for idx, item in enumerate(results['items']):
        track = item['track']
        
        track_info.append({
            "artist": track['artists'][0]['name'],
            "name": track['name'],
            "uri": track['uri'],
            "album_cover": track['album']['images'][0]['url']
        })

    return jsonify({
            'track_info': track_info,
            'username': sp.me()['display_name'],
            'userID': sp.me()['id']
        })

if __name__ == '__main__':
    app.run(port=5001)