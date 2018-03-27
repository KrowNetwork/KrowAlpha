import requests
import json
from Krow.applicant import Applicant

class Chain(object):

    def __init__(self, url):
        self.url = url;
        self.session = requests.Session()

    def get_applicant(self, applicantID):
        r = self.session.get("%sapi/Applicant/%s" % (self.url, applicantID))
        applicant_json = json.loads(json.dumps(r.json()))
        return Applicant(json=applicant_json)

    def post(self, obj):
        if obj.type == "applicant":
            data = obj.data
            r = self.session.post("%sapi/Applicant" % self.url, json=data)
            return r
