import requests

class Chain(object):

    def __init__(self, url):
        self.url = url;
        self.session = requests.Session()
