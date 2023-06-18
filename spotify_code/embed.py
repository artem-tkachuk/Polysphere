import os
from langchain.embeddings import OpenAIEmbeddings

from Expression2Text import Expression2Text

async def get_openai_embedding(query):
    # Load the OpenAI API key from the environment
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

    query_result = embeddings.embed_query(query)

    return query_result
    
async def embed(emotion_scores):
    return get_openai_embedding(Expression2Text(emotion_scores))


