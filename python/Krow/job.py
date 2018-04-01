import json

class Job(object):

    def __init__(self, json_data=None, employer=None):
        self.data = json.loads(json_data)
        if employer != None:
            self.data['employer'] = employer.ID
        self.ID = self.data["jobID"]
        self.type = "job"

    def change_flag(self, new_flag):
        self.data["flags"] = new_flag

    def __repr__(self):
        return "krow.asset.job(id=%s)" % self.ID
