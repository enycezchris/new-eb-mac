from os import listdir, rename
from os.path import isfile, join, splitext

from mysql.connector import connect, Error

working_dir = "/Volumes/_ transfers"
files = [f for f in listdir(working_dir) if isfile(join(working_dir, f))]

print(files)

pics = []
for file in files:
    print(file)
    new_filepath = working_dir + "/" + file
    hash = file.split(".", 1)[0]
    isNude = 0
    file = None
    model_name = None
    pics.append((new_filepath, hash, isNude, file, model_name))

try:
    with connect(
        host="desktop-hv0g29a",
        user="swift",
        password="swift",
        database="readysetaction",
    ) as connection:
        insert_pics = """
        INSERT INTO activecolors_photos
        (filepath,hash,isNude,original_filename,model_name)
        VALUES ( %s, %s, %s, %s, %s )
        ON DUPLICATE KEY UPDATE row_id=row_id;
        """
        with connection.cursor() as cursor:
            cursor.executemany(insert_pics, pics)
            connection.commit()
            result = cursor.fetchall()
            for row in result:
                print(row)
except Error as e:
    print(e)

print("done")
