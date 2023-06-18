import mindsdb_sdk

# Connect to cloud server
server = mindsdb_sdk.connect('https://cloud.mindsdb.com', login='zeeman6197@gmail.com', password='art101')


def textToImage(description = 'a happy face'): 

    project = server.get_project()

    query = project.query(f"SELECT * FROM mindsdb.dalle2 WHERE text = '{description}' ");
    print(query.fetch().loc[0, 'img_url'])

textToImage()



