import json

class Applicant(object):

    def __init__(self, json_data=None):
        self.data = json.loads(json_data)
        self.ID = self.data["applicantID"]
        self.type = "applicant"

    def __repr__(self):
        return "krow.participant.applicant(id=%s)" % self.ID


    def request_job(self, chain, employer, job):
        data = {
                  "$class": "network.krow.transactions.applicant.RequestJob",
                  "employer": employer.ID,
                  "applicant": self.ID,
                  "job": job.ID,
                }

        return chain.applicant_request_job(data)
