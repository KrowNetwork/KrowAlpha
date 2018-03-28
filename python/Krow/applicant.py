import json

class Applicant(object):

    def __init__(self, json_data=None):
        self.data = json.loads(json.dumps(json_data))
        self.ID = self.data["applicantID"]
        self.type = "applicant"

    def __repr__(self):
        return "krow.participant.applicant(id=%s)" % self.ID
