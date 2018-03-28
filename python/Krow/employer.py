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

    # TODO add remove job
