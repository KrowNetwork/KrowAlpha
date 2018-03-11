import random
import requests
import datetime
import string


class KrowRemove(object):
    def __init__(self, accesstoken):
        super(KrowRemove, self).__init__()
        self.headers = {"X-Access-Token": accesstoken}
        self.sess = requests.Session()
        self.sess.headers.update(self.headers)  

    def delete_user(self, userID=""):
        url = "http://18.220.46.51:3000/api/DeleteUser"
        data = {
                  "$class": "org.krow.remove.DeleteUser",
                  "user": userID,
                }


        r = self.sess.post(url, data = data)
        if r.status_code == 200:
            print ("User Deleted")
        else:
            print ("Error %s" % r.status_code)
            print (r.text)
