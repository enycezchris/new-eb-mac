from PIL import Image
from os import listdir, rename
from os.path import isfile, join, splitext
import imagehash

from numpy import base_repr
from getpass import getpass
from mysql.connector import connect, Error

seller = {
    "enycez-collections": {
        "database": "ebay",
        "table_name": "nudes",
        "input_dir": "/Users/wkchris/Desktop/photos/50-pics",
        "output_dir": "/Users/wkchris/Desktop/photos/output-nude",
        # "final_dir": "/Volumes/pictures/activecolors", addItems should move the photos into final directory
    }
}



seller_name = input("Seller name: ")
if seller_name not in seller.keys():
    print("invalid sellername")
    exit()

check_filename_equal_hash = input("check_filename_equal_hash? ")

modelName = input("Model name: ")
print(modelName)
if len(modelName) < 3:
    print("no model name")
    modelName = None

print("nonnude, FineArt")
notes = input("notes: ")
print(notes)
if len(notes) < 3:
    print("no notes")
    notes = None

print("check_filename_equal_hash", check_filename_equal_hash)

isNude = 1

working_dir = seller[seller_name]["input_dir"]
prod_dir = seller[seller_name]["output_dir"]
files = [f for f in listdir(working_dir) if isfile(join(working_dir, f))]

print("working directory: ", working_dir)
print("processed to ", prod_dir)
print("processing ", len(files))

print("continue?")
to_continue = input()
if to_continue.lower() != "yes":
    quit()
pics = []

try:
    with connect(
        host="127.0.0.1",
        user="test",
        password="example",
        database="ebay",
    ) as connection:
        connection.autocommit = True
        insert_pics = f"""
        INSERT INTO {seller[seller_name]["table_name"]}
        (filepath,hash,isNude,model_name,original_filename,notes)
        VALUES ( %s, %s, %s, %s, %s, %s )
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
                rgb_im = imgHandler.convert("RGB")
                rgb_im.save(filepath)
                filename, file_extension = splitext(file)
                hash = imagehash.phash(imgHandler)
                # print("hash diff", hash, compare_hash, hash - compare_hash)
                new_filepath = prod_dir + "/" + str(hash) + file_extension
                if check_filename_equal_hash == "no" or filepath != new_filepath:
                    print("inserting", filepath, new_filepath)
                    cursor.execute(
                        insert_pics,
                        (new_filepath, str(hash), isNude, modelName, file, notes),
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
