from Krow import *
import test_suite
import json
import time

chain = Chain("http://18.220.46.51:3000/")
test_suite.delete_samples(chain)
test_suite.create_samples(chain)
chain.delete_all_jobs()

for i in range(1000):
    try:
        print (i)
        chain = Chain("http://18.220.46.51:3000/")

        employer = chain.get_employer("SAMPLEEMPLOYER")

        employer.post_job(chain, json.load(open("../krow_jobs/%s.json" % i)))
        print ("Posted job %s" % i)
        # employer = chain.get_employer("SAMPLEEMPLOYER")
        # time.sleep(30)
    except KeyboardInterrupt:
        exit()
    # except:
        # print ("Skipped %s" % i)
        # employer = chain.get_employer("SAMPLEEMPLOYER")
