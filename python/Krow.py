import random
import requests
import string
import datetime
class krow(object):

    def __init__(self):
        pass

    def create_id(self, N):
        return ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(N))

    def create_user(self, first_name="", last_name="", birthday="", email=""):
        url = "http://18.220.46.51:3000/api/User"
        gen_id = self.create_id(10)
        date = datetime.datetime.now().isoformat()
        data = {"$class":"org.krow.participants.User",
                "userID": gen_id,
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
            print ("ID: %s" % gen_id)
            print ("Created: %s" % str(date))
        else:
            print ("Error %s" % r.status_code)
            print (r.text)

    def search_users_by_email(self, email=""):
        url = "http://18.220.46.51:3000/api/queries/getUserByEmail?email=%s" % email

        r = requests.get(url)
        if r.status_code == 200:
            print (r.text)
        else:
            print ("Error %s" % r.status_code)
            print (r.text)
