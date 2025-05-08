from os import listdir, rename
from os.path import isfile, join, splitext
from mysql.connector import connect, Error
import re

from PIL import Image
import imagehash


def de(tup):
    return tup[0]


files_in_db = None

try:
    with connect(
        host="desktop-hv0g29a",
        user="swift",
        password="swift",
        database="readysetaction",
    ) as connection:
        pics = """
        SELECT hash FROM photos
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
    for f in listdir("/Volumes/DESKTOP-JPAABKV-1/_pics/nudes-processing/")
    if isfile(join("/Volumes/DESKTOP-JPAABKV-1/_pics/nudes-processing/", f))
]

difference_result = []
for item in nudes_files:
    # print(item)
    if re.sub(r"\..*", "", item) not in files_in_db:
        difference_result.append(item)

print(difference_result)

for item in difference_result:
    print(
        ""
        + join("/Volumes/DESKTOP-JPAABKV-1/_pics/nudes/", item)
    )

# for item in difference_result:
#     print(
#         "mv "
#         + join("/Volumes/DESKTOP-JPAABKV-1/_pics/nudes/", item)
#         + " /Volumes/DESKTOP-JPAABKV-1/_pics/nudes-processing"
#     )

# for r in difference_result:
# print('/Volumes/DESKTOP-JPAABKV-1/_pics/nudes/{}'.format(r))

# get hash difference and find the pairs with less than 10
# for i, file in enumerate(files_in_db):
#     current_hash = imagehash.hex_to_hash(file)
#     for x in range(i+1, len(files_in_db)):
#         compare_hash = imagehash.hex_to_hash(files_in_db[x])
#         diff = current_hash - compare_hash
#         if diff < 15: print(diff, current_hash,compare_hash)
