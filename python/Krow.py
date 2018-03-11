import string
import KrowCreate
import KrowSearch
import KrowRemove

class Krow(KrowCreate.KrowCreate, KrowSearch.KrowSearch, KrowRemove.KrowRemove, KrowConnect.KrowConnect):

    def __init__(self, accesstoken):
        super(Krow, self).__init__(accesstoken)
        self.header = {"X-Access-Token": accesstoken}
