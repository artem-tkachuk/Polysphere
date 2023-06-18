import os
from langchain.embeddings import OpenAIEmbeddings
# from dotenv import load_dotenv

# load_dotenv()

# from Expression2Text import Expression2Text

def get_openai_embedding(query):
    # Load the OpenAI API key from the environment
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

    query_result = embeddings.embed_query(query)

    return query_result


def format_for_embedding(emotion_scores):
    emotion_strings = [
        f"the user is feeling a level of {emotion['score']} for {emotion['name']}" 
        for emotion in emotion_scores
    ]
    formatted = f", and ".join(emotion_strings) + "."
    return formatted


def embed(emotion_scores):    
    print("Extracting language embedding with OpenAI")
    return get_openai_embedding(format_for_embedding(emotion_scores))


# example = {
#     'userID': '31qitq2rtjexw4jw2kic2pqhetai', 
#     'userName': 'artGPT', 
#     'songName': 'Song 2', 
#     'top3Emotions': [
#         {'name': 'Calmness', 'score': 0.7496381998062134}, 
#         {'name': 'Boredom', 'score': 0.5506234765052795}, 
#         {'name': 'Concentration', 'score': 0.5269428491592407}
#     ]
# })