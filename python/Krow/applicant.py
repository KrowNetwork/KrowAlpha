import json

class Applicant(object):

    def __init__(self, file):
        self.data = json.load(open(file))
        self.ID = self.data["applicantID"]
        self.type = "applicant"

    def __repr__(self):
        return "krow.participant.applicant(id=%s)" % self.ID
