import random
import requests
import datetime
import string


class KrowSearch(object):
    def __init__(self):
        pass

    class search_user(object):

        @staticmethod
        def all():
            url = "http://18.220.46.51:3000/api/queries/getAllUsers"
            r = requests.get(url)
            if r.status_code == 200:
                return r.text
            else:
                print ("Error %s" % r.status_code)
                print (r.text)

        @staticmethod
        def by_email(email=""):
            url = "http://18.220.46.51:3000/api/queries/getUserByEmail?email=%s" % email
            r = requests.get(url)
            if r.status_code == 200:
                return r.text
            else:
                print ("Error %s" % r.status_code)
                print (r.text)

        @staticmethod
        def by_first_name(first_name=""):
            url = "http://18.220.46.51:3000/api/queries/getUserByFirstName?fName=%s" % first_name
            r = requests.get(url)
            if r.status_code == 200:
                return r.text
            else:
                print ("Error %s" % r.status_code)
                print (r.text)

        @staticmethod
        def by_last_name(last_name=""):
            url = "http://18.220.46.51:3000/api/queries/getUserByLastName?lName=%s" % last_name
            r = requests.get(url)
            if r.status_code == 200:
                return r.text
            else:
                print ("Error %s" % r.status_code)
                print (r.text)

        @staticmethod
        def by_ID(userID=""):
            url = "http://18.220.46.51:3000/api/queries/getUserByID?userID=%s" % userID
            r = requests.get(url)
            if r.status_code == 200:
                return r.text
            else:
                print ("Error %s" % r.status_code)
                print (r.text)
