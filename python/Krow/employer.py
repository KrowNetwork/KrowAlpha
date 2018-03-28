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

        chain.post_transaction("NewJob", data)

    def hire_applicant(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.HireApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        chain.post_transaction("HireApplicant", data)

    # TODO add remove job
