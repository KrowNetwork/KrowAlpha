class JSONError(Exception):

    def __init__(self, message):
        self.message = message

class ObjectNotFoundError(Exception):

    def __int__(self, message):
        self.message = message
