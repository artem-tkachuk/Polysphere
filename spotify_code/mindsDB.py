import mindsdb_sdk

# Connect to cloud server
server = mindsdb_sdk.connect('https://cloud.mindsdb.com', login='zeeman6197@gmail.com', password='art101')

project = server.get_project()

query = project.query("SELECT * FROM mindsdb.dalle2 WHERE text = 'a happy face'");
print(query.fetch().loc[0, 'img_url'])