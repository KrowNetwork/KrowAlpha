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
              "newJob": job,
              }

        r = chain.post_transaction("NewJob", data)
        return r

    def get_avaliable_job_IDs(self):
        jobs = self.data['availableJobs']
        ids = []
        for job in jobs:
            id = job.split("#")[-1]
            ids.append(id)

        return ids


    def remove_job(self, chain, job):
        data = {
              "$class": "network.krow.transactions.employer.RemoveJob",
              "employer": self.ID,
              "job": job.ID,
              }

        r = chain.post_transaction("RemoveJob", data)
        return r

    def deny_applicant(self, chain, applicant, job, reason=""):
        data = {
              "$class": "network.krow.transactions.employer.DenyApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID,
              "reason": reason
              }

        r = chain.post_transaction("DenyApplicant", data)
        return r

    def request_hire_applicant(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.RequestHireApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("RequestHireApplicant", data)
        return r

    def unrequest_hire_applicant(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.UnrequestHireApplicant",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("UnrequestHireApplicant", data)
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

    def accept_complete_job(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.CompleteJob",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("CompleteJob", data)
        return r

    def deny_request_complete(self, chain, applicant, job):
        data = {
              "$class": "network.krow.transactions.employer.DenyRequestCompleteJob",
              "employer": self.ID,
              "job": job.ID,
              "applicant": applicant.ID
              }

        r = chain.post_transaction("DenyRequestCompleteJob", data)
        return r

    def endorse_skill(self, chain, applicant, skill):
        data = {
              "$class": "network.krow.transactions.employer.EndorseSkill",
              "employer": self.ID,
              "applicant": applicant.ID,
              "skillName": skill
              }

        r = chain.post_transaction("EndorseSkill", data)
        return r

    def unendorse_skill(self, chain, applicant, skill):
        data = {
              "$class": "network.krow.transactions.employer.UnendorseSkill",
              "employer": self.ID,
              "applicant": applicant.ID,
              "skillName": skill
              }

        r = chain.post_transaction("UnendorseSkill", data)
        return r


    # TODO add remove job
