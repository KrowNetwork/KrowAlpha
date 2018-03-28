import json

class Job(object):

    def __init__(self, json_data=None):
        self.data = json.loads(json_data)
        self.ID = self.data["jobID"]
        self.type = "job"

    def __repr__(self):
        return "krow.asset.job(id=%s)" % self.ID
