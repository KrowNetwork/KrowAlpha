import random
import requests
import datetime
import string

class KrowSearch(object):
    def __init__(self, accesstoken):
        self.headers = {"X-Access-Token": accesstoken}
        self.search_user = search_user(self.headers)
        self.search_company = search_company(self.headers)
        
class search_user(object):
        
    def __init__(self, headers):
        self.headers = headers
        self.sess = requests.Session()
        self.sess.headers.update(self.headers)
        
    def all(self):
        url = "http://18.220.46.51:3000/api/queries/getAllUsers"
        r = self.sess.get(url)
        if r.status_code == 200:
            return r.text
        else:
            print ("Error %s" % r.status_code)
            print (r.text)

        
    def by_email(self, email=""):
        url = "http://18.220.46.51:3000/api/queries/getUserByEmail?email=%s" % email
        r = self.sess.get(url)
        if r.status_code == 200:
            return r.text
        else:
            print ("Error %s" % r.status_code)
            print (r.text)    

    def by_first_name(self, first_name=""):
        url = "http://18.220.46.51:3000/api/queries/getUserByFirstName?fName=%s" % first_name
        r = self.sess.get(url)
        if r.status_code == 200:
            return r.text
        else:
            print ("Error %s" % r.status_code)
            print (r.text)

    def by_last_name(self, last_name=""):
        url = "http://18.220.46.51:3000/api/queries/getUserByLastName?lName=%s" % last_name
        r = self.sess.get(url)
        if r.status_code == 200:
            return r.text
        else:
            print ("Error %s" % r.status_code)
            print (r.text)

    def by_ID(self, userID=""):
        url = "http://18.220.46.51:3000/api/queries/getUserByID?userID=%s" % userID
        r = self.sess.get(url)
        if r.status_code == 200:
            return r.text
        else:
            print ("Error %s" % r.status_code)
            print (r.text)
            
            

class search_company(object):
    def __init__(self, headers):
        self.headers = headers
        self.sess = requests.Session()
        self.sess.headers.update(self.headers)  
        
    def all(self):
        url = "http://18.220.46.51:3000/api/queries/getAllCompanies"
        r = self.sess.get(url)
        if r.status_code == 200:
            return r.text
        else:
            print ("Error %s" % r.status_code)
            print (r.text)

