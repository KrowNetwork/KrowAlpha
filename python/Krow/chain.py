import requests
import json
from Krow.applicant import Applicant
from Krow.errors import JSONError

class Chain(object):

    def __init__(self, url):
        self.url = url;
        self.session = requests.Session()

    def get_applicant(self, applicantID):
        r = self.session.get("%sapi/Applicant/%s" % (self.url, applicantID))
        if r.status_code != 200:
            raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
        applicant_json = json.loads(json.dumps(r.json()))
        return Applicant(json=applicant_json)

    def post(self, obj):
        if obj.type == "applicant":
            data = obj.data
            r = self.session.post("%sapi/Applicant" % self.url, json=data)
            if r.status_code != 200:
                raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
            return r

        elif obj.type == "employer":
            data = obj.data
            r = self.session.post("%sapi/Employer" % self.url, json=data)
            if r.status_code != 200:
                raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
            return r
