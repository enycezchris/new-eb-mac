from os import listdir, rename
from os.path import isfile, join, splitext
from mysql.connector import connect, Error

from PIL import Image
import imagehash

def de(tup):
    return tup[0]


files_in_db = None

try:
    with connect(
        host="192.168.1.98",
        user="swift",
        password="swift",
        database="readysetaction",
    ) as connection:
        pics = """
        SELECT hash FROM activecolors_photos
        """
        with connection.cursor() as cursor:
            cursor.execute(pics)
            result = cursor.fetchall()
            res = map(de, result)
            files_in_db = list(res)
except Error as e:
    print(e)

nudes_files = [
    f
    for f in listdir("/Volumes/DESKTOP-JPAABKV-1/_pics/nudes/")
    if isfile(join("/Volumes/DESKTOP-JPAABKV-1/_pics/nudes/", f))
]

# get hash difference and find the pairs with less than 10
for i, file in enumerate(files_in_db):
    current_hash = imagehash.hex_to_hash(file)
    for x in range(i + 1, len(files_in_db)):
        compare_hash = imagehash.hex_to_hash(files_in_db[x])
        try:
            print(file)
            print(files_in_db[x])
            diff = current_hash - compare_hash
            print(diff)
        except Error as e:
            print(file)
            print(files_in_db[x])

    #     if diff < 15:
    #         print(diff, current_hash, compare_hash)
