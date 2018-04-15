import requests
import json
from Krow.applicant import Applicant
from Krow.employer import Employer
from Krow.job import Job
from Krow.errors import JSONError, ObjectNotFoundError


class Chain(object):

    def __init__(self, url):
        self.url = url
        self.session = requests.Session()

    def get_applicant(self, applicantID):
        r = self.session.get("%sapi/Applicant/%s" % (self.url, applicantID))
        if r.status_code != 200:
            raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
        applicant_json = json.loads(json.dumps(r.text))
        return Applicant(json_data=applicant_json)

    def get_employer(self, employerID):
        r = self.session.get("%sapi/Employer/%s" % (self.url, employerID))
        if r.status_code != 200:
            raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
        employer_json = json.loads(json.dumps(r.text))
        return Employer(json_data=employer_json)

    def get_job(self, jobID):
        r = self.session.get("%sapi/Job/%s" % (self.url, jobID))
        if r.status_code != 200:
            raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
        job_json = json.loads(json.dumps(r.text))
        return Job(json_data=job_json)

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

        elif obj.type == "job":
            data = obj.data
            r = self.session.post("%sapi/Job" % self.url, json=data)
            if r.status_code != 200:
                raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.text))
            return r

    def put(self, obj):
        if obj.type == "applicant":
            data = obj.data
            r = self.session.put("%sapi/Applicant/%s" % (self.url, obj.ID), json=data)
            if r.status_code != 200:
                raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.json()['error']['message']))
            return r

        elif obj.type == "employer":
            data = obj.data
            r = self.session.put("%sapi/Employer/%s" % (self.url, obj.ID), json=data)
            if r.status_code != 200:
                raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.json()['error']['message']))
            return r

        elif obj.type == "job":
            data = obj.data
            r = self.session.put("%sapi/Job/%s" % (self.url, obj.ID), json=data)
            if r.status_code != 200:
                raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.json()['error']['message']))
            return r

    def delete(self, type, ID):
        r = self.session.delete("%sapi/%s/%s" % (self.url, type, ID))
        if r.status_code == 404:
            raise ObjectNotFoundError("Objet of type \"%s\" with ID \"%s\" was not found in the chain" % (type, ID))
        elif r.status_code != 204:
            raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.json()['error']['message']))
        return r

    def post_transaction(self, type, data):
        r = self.session.post("%sapi/%s" % (self.url, type), json=data)
        if r.status_code != 200:
            raise JSONError("Status code %s returned. Json returned: \n\n%s" % (r.status_code, r.json()['error']['message']))
        return r

    def get_history(self):
        r = self.session.get("%sapi/system/historian" % self.url)
        return r
