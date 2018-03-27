import requests

class Chain(object):

    def __init__(self, url):
        self.url = url;
        self.session = requests.Session()

    def post(self, obj):
        if obj.type == "applicant":
            data = obj.data
            r = self.session.post("%sapi/Applicant" % self.url, json=data)
            return r
