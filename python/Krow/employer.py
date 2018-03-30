import json
from Krow.job import Job

class Employer(object):

    def __init__(self, json_data=None):
        self.data = json.loads(json_data)
        self.ID = self.data["employerID"]
        self.type = "employer"

    def __repr__(self):
        return "krow.participant.employer(id=%s)" % self.ID


    def create_job(self, json_data):
        job = Job(json_data)
        job.data['employer'] = self.ID
        return job

    def post_job(self, chain, job):
        data = {
              "$class": "network.krow.transactions.employer.NewJob",
              "employer": self.ID,
              "job": job.ID,
              }

        r = chain.post_transaction("NewJob", data)
        return r

    def remove_job(self, chain, employer, job):
        data = {
              "$class": "network.krow.transactions.employer.RemoveJob",
              "employer": self.ID,
              "job": job.ID,
              }

        r = chain.post_transaction("RemoveJob", data)
        return r

    def deny_applicant(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.DenyApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("HireApplicant", data)
        return r

    def hire_applicant(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.HireApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("HireApplicant", data)
        return r

    def fire_applicant(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.FireApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("FireApplicant", data)
        return r


    # TODO add remove job
