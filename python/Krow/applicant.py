import json

class Applicant(object):

    def __init__(self, file=None, json_data=None):
        if file != None:
            self.data = json.load(open(file))
        else:
            self.data = json_data

        self.ID = self.data["applicantID"]
        self.type = "applicant"

    def __repr__(self):
        return "krow.participant.applicant(id=%s)" % self.ID
