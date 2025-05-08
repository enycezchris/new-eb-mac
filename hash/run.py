from PIL import Image
from os import listdir, rename
from os.path import isfile, join, splitext
import imagehash

from numpy import base_repr
from getpass import getpass
from mysql.connector import connect, Error

print('process to: ("nudes" or "non_nudes"):')
dir = input()
if dir == "nudes":
    isNude = 1
elif dir == "non_nudes":
    isNude = 0
else:
    print("invalid input")
    quit()

prod_dir = "/Users/swong/dev/{}".format(dir)
working_dir = "/Users/swong/dev/{}-processing".format(dir)
files = [f for f in listdir(working_dir) if isfile(join(working_dir, f))]

print("check_filename_equal_hash?")
check_filename_equal_hash = input()

print("model name?")
model_name = input()
if model_name.lower() == "none":
    model_name = None

print("check_filename_equal_hash", check_filename_equal_hash)
print("model name ", model_name)
print("working directory: ", working_dir)
print("processed to ", prod_dir)
print("processing ", len(files))

print("continue?")
to_continue = input()
if to_continue.lower() != "yes":
    quit()
pics = []

# for file in files:
#     print(file)
#     filepath = working_dir + "/" + file
#     try:
#         imgHandler = Image.open(filepath)
#     except:
#         continue
#     try:
#         imgHandler.info.pop("parameters")
#     except:
#         pass
#     imgHandler.save(filepath)
#     filename, file_extension = splitext(file)
#     hash = imagehash.phash(imgHandler)
#     # print("hash diff", hash, compare_hash, hash - compare_hash)
#     new_filepath = prod_dir + "/" + str(hash) + file_extension
#     if check_filename_equal_hash == "no" or filepath != new_filepath:
#         pics.append((new_filepath, str(hash), isNude, file, model_name))
#         rename(filepath, new_filepath)
#         print("renamed file from\n", filepath, "\n", new_filepath)
#         print("---------------")

try:
    with connect(
        host="desktop-hv0g29a",
        user="swift",
        password="swift",
        database="readysetaction",
    ) as connection:
        connection.autocommit = True
        insert_pics = """
        INSERT INTO photos
        (filepath,hash,isNude)
        VALUES ( %s, %s, %s )
        ON DUPLICATE KEY UPDATE row_id=row_id;
        """
        with connection.cursor() as cursor:
            for file in files:
                print(file)
                filepath = working_dir + "/" + file
                try:
                    imgHandler = Image.open(filepath)
                except:
                    continue
                try:
                    imgHandler.info.pop("parameters")
                except:
                    pass
                imgHandler.save(filepath)
                filename, file_extension = splitext(file)
                hash = imagehash.phash(imgHandler)
                # print("hash diff", hash, compare_hash, hash - compare_hash)
                new_filepath = prod_dir + "/" + str(hash) + file_extension
                if check_filename_equal_hash == "no" or filepath != new_filepath:
                    print("inserting", filepath, new_filepath)
                    cursor.execute(
                        insert_pics, (new_filepath, str(hash), isNude)
                    )
                    print(cursor._executed)
                    results = cursor.fetchall()
                    for x in results:
                        print(x)
                    rename(filepath, new_filepath)
                    print("renamed and moved file from\n", filepath, "\n", new_filepath)
                    print("---------------")
except Error as e:
    print(e)

print("done")
