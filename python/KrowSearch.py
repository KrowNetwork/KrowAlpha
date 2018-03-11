import random
import requests
import datetime
import string


class KrowSearch(object):
    def __init__(self):
        pass

    class search_user(object):
        
        @staticmethod
        def by_email(email=""):
            url = "http://18.220.46.51:3000/api/queries/getUserByEmail?email=%s" % email
            r = requests.get(url)
            if r.status_code == 200:
                print (r.text)
            else:
                print ("Error %s" % r.status_code)
                print (r.text)
