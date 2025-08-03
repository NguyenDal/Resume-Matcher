import sqlite3

# Connect to the SQLite database file named 'app.db'.
conn = sqlite3.connect("app.db")

# Create a cursor object to interact with the database.
cursor = conn.cursor()

# Execute a SQL query to get the names of all tables in the database.
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")

# Print out the list of table names found in the database.
print(cursor.fetchall())

# Close the database connection to free up resources.
conn.close()