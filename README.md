## Inspiration
We are incredibly passionate about the arts, especially music, film, books, etc. These areas are heavily influenced by machine recommendations. A lot of such algorithms have been relying on minimal human input to drive conclusions and improve over time. 

We believe that AI tools provide an excellent opportunity to finally add a new dimension to this process, simultaneously connecting people that are not just from the same school or college or job, but also whose souls will likely connect on a deep level - much like a crowd at a concert of a favorite band.  We believe our solution in the long term has the potential to reverse the tendency for loneliness among young people, improve the quality of the content people consume,  foster international friendship instead of wars, and in general, become the new primary platform where people discover, share, and consume content and entertainment.

For us CalHacks LLM Hackathon is an excellent opportunity to make a bold move and pursue this ambitious vision!

## What it does
- Lets you link your Spotify account
- Listen to Spotify tracks right on the Polysphere website, but now with the power of real-time facial expression analysis of Hume.ai - add a new emotional dimension to how you discover and experience music
- Enjoy better recommendations and find people with whom you share a taste in music with much more datapoints than a few entries like before
- Visualize album covers in a beautiful grid that updates in **real time**, generate an NFT out of it, and mint it on the Solana blockchain

## How we built it

- Spotify provided a player and recently played songs

- Hume helps real-time facial expression recognition and probability distribution while listening. This data gets recorded and then helps find people who react similarly to the songs you ask LLM about.

- MongoDB stores metadata for users and helps narrow search to be able to search people by their emotions about the specific songs

- Pinecone - vector database for LlM, similarity search

- GPT-4 — engine for embeddings and underlying LLM

- Python, React, VS Code, Webstorm, PyCharm - just developer tools we used to code

- Google Cloud storage - store files for minting NFTs on Solana

- Solana - minting NFTs corresponding to people’s album grids retrieved from Spotify

- MindsDB - EASILY access DALL-E via the Python SDK and feed context to it about how a person feels about a particular song and get some unique copyright-free artwork. Potential to make it a Solana NFT too.

- Langchain and Hume helped us build embeddings for the vectors that correspond to top emotions across the song-play period

## Challenges we ran into
- Pinecone free trial restricts # of indices
- To allow access to the MindsDB calendar, a regular user has to go through essential hell (for them), installing Google Cloud Platform, etc.
- Hume.ai is lagging sometimes
- It is impossible to control the dimension of the embedding that OpenAI produces
- Solana NFT minting testing wallet is non-trivial
- Hume.ai's Dynamic Reaction real-time API is not available yet, even though we planned out the project around it
- It is hard to learn new programming languages on the fly and execute reliably with them
- Sometimes code on one computer doesn't work on the other at all and it messes everything up, but that's life :)

## Accomplishments that we're proud of
- We integrated almost every tool at the hackathon!
- We have a lot of things working, many in real-time, and some components are almost functional. We tried our VERY best but sometimes things just do not work in the constrained hackathon time.
- We became good friends in the process and plan to continue developing this idea along with other Berkeley students -- all three of us are alumni!

## What we learned

## What's next for Polysphere
- Apple Music as a second primary data source for music to bridge the gap between platforms and allow people to connect regardless of which service they use
- Netflix, HBO, etc.
- Films, books, and other similar content -> coming into one time-series database, providing a powerful data source for better intelligence and better multi-model recommendations
- Use embeddings and emotion scores to generate custom artwork based on this textual data using OpenAI DALL-E and MindsDB, minting it into Solana NFTs so people can be proud of their cultural horizon
