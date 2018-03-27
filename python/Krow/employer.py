import json

class Employer(object):

    def __init__(self, file=None, json_data=None):
        if file != None:
            self.data = json.load(open(file))
        else:
            self.data = json_data

        self.ID = self.data["employerID"]
        self.type = "employer"

    def __repr__(self):
        return "krow.participant.employer(id=%s)" % self.ID
