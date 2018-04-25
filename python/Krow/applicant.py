import json

class Applicant(object):

    def __init__(self, json_data=None):
        self.data = json.loads(json_data)
        self.ID = self.data["applicantID"]
        self.type = "applicant"

    def __repr__(self):
        return "krow.participant.applicant(id=%s)" % self.ID


    def request_job(self, chain, job):
        data = {
                  "$class": "network.krow.transactions.applicant.RequestJob",
                  "applicant": self.ID,
                  "job": job.ID,
                }

        return chain.post_transaction("RequestJob", data)

    def accept_hire(self, chain, employer, job):
        data = {
                  "$class": "network.krow.transactions.applicant.AcceptHire",
                  "employer": employer.ID,
                  "applicant": self.ID,
                  "job": job.ID,
                }

        return chain.post_transaction("AcceptHire", data)

    def unrequest_job(self, chain, job):
        data = {
                  "$class": "network.krow.transactions.applicant.UnrequestJob",
                  "applicant": self.ID,
                  "job": job.ID,
                }

        return chain.post_transaction("RequestJob", data)

    def resign_job(self, chain, employer, job, reason=""):
        data = {
                  "$class": "network.krow.transactions.applicant.ResignJob",
                  "employer": employer.ID,
                  "applicant": self.ID,
                  "job": job.ID,
                  "reason": reason
                }

        return chain.post_transaction("ResignJob", data)

    def request_complete_job(self, chain, job):
        data = {
                  "$class": "network.krow.transactions.applicant.RequestCompleteJob",
                  "applicant": self.ID,
                  "job": job.ID,
                }

        return chain.post_transaction("RequestCompleteJob", data)

    def update_resume(self, chain, resume):
        data = {
                  "$class": "network.krow.transactions.applicant.UpdateResume",
                  "applicant": self.ID,
                  "resume": resume,
                }

        return chain.post_transaction("UpdateResume", data)
