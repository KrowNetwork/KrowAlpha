import random
import requests
import datetime
import string


class KrowConnect(object):
    def __init__(self, accesstoken):
        super(KrowConnect, self).__init__()
        self.headers = {"X-Access-Token": accesstoken}
        self.sess = requests.Session()
        self.sess.headers.update(self.headers)  

    def connect_user_and_resume(self, userID="", resumeID=""):
        url = "http://18.220.46.51:3000/api/AddResume"
        data = {
                  "$class": "org.krow.transactions.AddResume",
                  "resume": resumeID,
                  "user": userID,
                }

        r = self.sess.post(url, data = data)
        if r.status_code == 200:
            print ("Resume Connected")
        else:
            print ("Error %s" % r.status_code)
            print (r.text)
