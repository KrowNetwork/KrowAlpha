import random
import requests
import datetime
import string

class KrowCreate(object):

    def __init__(self):
        pass

    def create_id(self, N):
        return ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(N))

    def create_user(self, first_name="", last_name="", birthday="", email=""):
        url = "http://18.220.46.51:3000/api/User"
        userID = self.create_id(10)
        date = datetime.datetime.now().isoformat()
        data = {"$class":"org.krow.participants.User",
                "userID": userID,
                "fName": first_name,
                "lName": last_name,
                "birthDay": birthday,
                "email": email,
                "resume": {},
                "created": str(date)
                }


        r = requests.post(url, data = data)
        if r.status_code == 200:
            print ("New User Created:")
            print ("First Name: %s" % first_name)
            print ("Last Name: %s" % last_name)
            print ("Birthday: %s" % birthday)
            print ("Email: %s" % email)
            print ("ID: %s" % userID)
            print ("Created: %s" % str(date))
        else:
            print ("Error %s" % r.status_code)
            print (r.text)
            
    def create_company(self, company_name="", contact_email=""):
        url = "http://18.220.46.51:3000/api/Company"
        compID = self.create_id(10)
        date = datetime.datetime.now().isoformat()
        data = {
                "$class": "org.krow.participants.Company",
                "compID": compID,
                "cName": company_name,
                "contactEmail": contact_email,
                "created": str(date)
                }


        r = requests.post(url, data = data)
        if r.status_code == 200:
            print ("New Company Created:")
            print ("Company Name: %s" % first_name)
            print ("Contact Email: %s" % contact_email)
            print ("ID: %s" % compID)
            print ("Created: %s" % str(date))
        else:
            print ("Error %s" % r.status_code)
            print (r.text)
