from Krow import Chain, Employer, Applicant, Job, JSONError
import time
import dateutil.parser
import datetime
import json
import logging

logging.basicConfig(level=logging.INFO)


FAIL = "fail"
PASS = "pass"

def clear(chain):
    employer = Employer(open("sample_employer.json").read())
    applicant = Applicant(open("sample_applicant.json").read())
    job = Job(open("sample_job.json").read(), employer=employer)

    chain.put(employer)
    chain.put(applicant)
    chain.put(job)
    employer.post_job(chain, job)
    logging.info("samples reset")

def create_samples(chain):
    employer = Employer(open("sample_employer.json").read())
    applicant = Applicant(open("sample_applicant.json").read())
    job = Job(open("sample_job.json").read(), employer=employer)

    chain.post(employer)
    chain.post(applicant)
    chain.post(job)
    employer.post_job(chain, job)
    logging.info("samples created")

def delete_samples(chain):
    chain.delete('employer', "SAMPLEEMPLOYER")
    chain.delete('applicant', 'SAMPLEAPPLICANT')
    chain.delete('job', 'SAMPLEJOB')
    logging.info("samples created")


def get_samples(chain):
    applicant = chain.get_applicant("SAMPLEAPPLICANT")
    employer = chain.get_employer("SAMPLEEMPLOYER")
    job = chain.get_job("SAMPLEJOB")
    logging.info("got samples from chain")

    return applicant, employer, job

def test_all(chain, locations):
    logging.info("running tests")
    res = {
            "test_1": None,
            "test_2": None,
            "test_3": None,
            "test_4": None,
            "test_5": None,
          }

    res['test_1'] = test_1(chain, locations[0])
    res['test_2'] = test_2(chain, locations[1])
    res['test_3'] = test_3(chain, locations[2])
    res['test_4'] = test_4(chain, locations[3])
    res['test_5'] = test_5(chain, locations[4])
    res['test_6'] = test_6(chain, locations[5])

    logging.info("tests completed")

    return res

'''TESTS:
    test_1 -> Applicant requests job, employer requests to hire
    test_2 -> Applicant requests job, employer requests to hire, applicant accepts, employer fires
    test_2 -> Applicant requests job, applicant unrequests job
    test_4 -> Applicant requests job, employer denies
    test_5 -> Applicant requests job, employer denies, applicant requests again
    test_5 -> Applicant requests job, employer requests to hire, applicant accepts

'''

def test_1(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain)

    applicant, employer, job = get_samples(chain)

    logging.info("running test_1")

    applicant.request_job(chain, employer, job)   #WORKS
    employer.request_hire_applicant(chain, applicant, job)    #WORKS

    logging.info("test_1 completed, checking results")

    applicant, employer, job = get_samples(chain)

    sample_applicant = json.loads(open("%ssample_applicant.json" % location).read())
    sample_employer = json.loads(open("%ssample_employer.json" % location).read())
    sample_job = json.loads(open("%ssample_job.json" % location).read())

    sample_applicant.pop('lastUpdated', None)
    applicant.data.pop('lastUpdated', None)

    sample_employer.pop('lastUpdated', None)
    employer.data.pop('lastUpdated', None)

    sample_job.pop('lastUpdated', None)
    job.data.pop('lastUpdated', None)

    sample_job.pop('created', None)
    job.data.pop('created', None)

    if sample_applicant != applicant.data:
        res["Applicant"] = FAIL

    if sample_employer != employer.data:
        res["Employer"] = FAIL

    if sample_job != job.data:
        res["Job"] = FAIL

    logging.info("results checked")

    return res

def test_2(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain)

    applicant, employer, job = get_samples(chain)

    logging.info("running test_2")

    applicant.request_job(chain, employer, job)  #WORKS
    employer.request_hire_applicant(chain, applicant, job)    #WORKS
    applicant.accept_hire(chain, employer, job)    #WORKS
    employer.fire_applicant(chain, applicant, job)    #WORKS

    logging.info("test_2 completed, checking results")

    applicant, employer, job = get_samples(chain)

    sample_applicant = json.loads(open("%ssample_applicant.json" % location).read())
    sample_employer = json.loads(open("%ssample_employer.json" % location).read())
    sample_job = json.loads(open("%ssample_job.json" % location).read())

    sample_applicant.pop('lastUpdated', None)
    applicant.data.pop('lastUpdated', None)

    sample_employer.pop('lastUpdated', None)
    employer.data.pop('lastUpdated', None)

    sample_job.pop('lastUpdated', None)
    job.data.pop('lastUpdated', None)

    sample_job.pop('created', None)
    job.data.pop('created', None)

    if sample_applicant != applicant.data:
        res["Applicant"] = FAIL

    if sample_employer != employer.data:
        res["Employer"] = FAIL

    if sample_job != job.data:
        res["Job"] = FAIL

    logging.info("results checked")

    return res

def test_3(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain)

    applicant, employer, job = get_samples(chain)

    logging.info("running test_3")

    applicant.request_job(chain, employer, job)   #WORKS
    applicant.unrequest_job(chain, employer, job)   #WORKS

    logging.info("test_3 completed, checking results")

    applicant, employer, job = get_samples(chain)

    sample_applicant = json.loads(open("%ssample_applicant.json" % location).read())
    sample_employer = json.loads(open("%ssample_employer.json" % location).read())
    sample_job = json.loads(open("%ssample_job.json" % location).read())

    sample_applicant.pop('lastUpdated', None)
    applicant.data.pop('lastUpdated', None)

    sample_employer.pop('lastUpdated', None)
    employer.data.pop('lastUpdated', None)

    sample_job.pop('lastUpdated', None)
    job.data.pop('lastUpdated', None)

    sample_job.pop('created', None)
    job.data.pop('created', None)

    if sample_applicant != applicant.data:
        res["Applicant"] = FAIL

    if sample_employer != employer.data:
        res["Employer"] = FAIL

    if sample_job != job.data:
        res["Job"] = FAIL

    logging.info("results checked")

    return res

def test_4(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain)

    applicant, employer, job = get_samples(chain)

    logging.info("running test_4")

    applicant.request_job(chain, employer, job)   #WORKS
    employer.deny_applicant(chain, applicant, job)   #WORKS

    logging.info("test_4 completed, checking results")

    applicant, employer, job = get_samples(chain)

    sample_applicant = json.loads(open("%ssample_applicant.json" % location).read())
    sample_employer = json.loads(open("%ssample_employer.json" % location).read())
    sample_job = json.loads(open("%ssample_job.json" % location).read())

    sample_applicant.pop('lastUpdated', None)
    applicant.data.pop('lastUpdated', None)

    sample_employer.pop('lastUpdated', None)
    employer.data.pop('lastUpdated', None)

    sample_job.pop('lastUpdated', None)
    job.data.pop('lastUpdated', None)

    sample_job.pop('created', None)
    job.data.pop('created', None)

    sample_job['deniedApplicants'][0].pop('deniedDate', None)
    job.data['deniedApplicants'][0].pop('deniedDate', None)

    if sample_applicant != applicant.data:
        res["Applicant"] = FAIL

    if sample_employer != employer.data:
        res["Employer"] = FAIL

    if sample_job != job.data:
        res["Job"] = FAIL

    logging.info("results checked")

    return res

def test_5(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain)

    applicant, employer, job = get_samples(chain)

    logging.info("running test_5")

    applicant.request_job(chain, employer, job)   #WORKS
    employer.deny_applicant(chain, applicant, job)   #WORKS
    error = False
    try:
        applicant.request_job(chain, employer, job)   #WORKS
    except JSONError:
        error = True

    logging.info("test_5 completed, checking results")

    applicant, employer, job = get_samples(chain)

    sample_applicant = json.loads(open("%ssample_applicant.json" % location).read())
    sample_employer = json.loads(open("%ssample_employer.json" % location).read())
    sample_job = json.loads(open("%ssample_job.json" % location).read())

    sample_applicant.pop('lastUpdated', None)
    applicant.data.pop('lastUpdated', None)

    sample_employer.pop('lastUpdated', None)
    employer.data.pop('lastUpdated', None)

    sample_job.pop('lastUpdated', None)
    job.data.pop('lastUpdated', None)

    sample_job.pop('created', None)
    job.data.pop('created', None)

    sample_job['deniedApplicants'][0].pop('deniedDate', None)
    job.data['deniedApplicants'][0].pop('deniedDate', None)

    if sample_applicant != applicant.data or error == False:
        res["Applicant"] = FAIL

    if sample_employer != employer.data:
        res["Employer"] = FAIL

    if sample_job != job.data:
        res["Job"] = FAIL

    logging.info("results checked")

    return res

def test_6(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain)

    applicant, employer, job = get_samples(chain)

    logging.info("running test_6")

    applicant.request_job(chain, employer, job)   #WORKS
    employer.request_hire_applicant(chain, applicant, job)    #WORKS
    applicant.accept_hire(chain, employer, job)   #WORKS

    logging.info("test_6 completed, checking results")

    applicant, employer, job = get_samples(chain)

    sample_applicant = json.loads(open("%ssample_applicant.json" % location).read())
    sample_employer = json.loads(open("%ssample_employer.json" % location).read())
    sample_job = json.loads(open("%ssample_job.json" % location).read())

    sample_applicant.pop('lastUpdated', None)
    applicant.data.pop('lastUpdated', None)

    sample_employer.pop('lastUpdated', None)
    employer.data.pop('lastUpdated', None)

    sample_job.pop('lastUpdated', None)
    job.data.pop('lastUpdated', None)

    sample_job.pop('created', None)
    job.data.pop('created', None)

    sample_job.pop('startDate', None)
    job.data.pop('startDate', None)

    if sample_applicant != applicant.data:
        res["Applicant"] = FAIL

    if sample_employer != employer.data:
        res["Employer"] = FAIL

    if sample_job != job.data:
        res["Job"] = FAIL

    logging.info("results checked")

    return res

def request_hire_accept_resign(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS
    applicant.accept_hire(chain, employer, job); print ("accepted")   #WORKS
    applicant.resign_job(chain, employer, job); print ("resigned")    #WORKS

def request_hire_accept_resign_fire(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS
    applicant.accept_hire(chain, employer, job); print ("accepted")   #WORKS
    applicant.resign_job(chain, employer, job); print ("resigned")    #WORKS
    employer.fire_applicant(chain, applicant, job); print ("fired")    #WORKS

def request_hire_accept_applicant_complete(chain):
    '''STATUS: FAIL'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS
    applicant.accept_hire(chain, employer, job); print ("accepted")   #WORKS
    applicant.complete_job(chain, employer, job); print ("completed")    #NOT WRITTEN IN CODE

def get_transaction_history(chain):
    r = chain.get_history()
    json = r.json()
    data = []
    for i in json:
        x = dateutil.parser.parse(i['transactionTimestamp'])
        i['transactionTimestamp'] = x.strftime("%m-%d-%Y %H:%M:%S")

    json.sort(key=lambda item:item['transactionTimestamp'])#, reverse=True)
    for i in json:
        str = "Transaction Time: %s\n" % i['transactionTimestamp']
        str += "Transaction Type: %s\n" % i['transactionType']
        str += "Transaction ID: %s\n" % i['transactionId']
        try:
            str += "Invoked By: %s\n" % i['participantInvoking']
        except:
            pass
        if i['eventsEmitted'] == []:
            str += "Events Emitted: None\n"
        else:
            str += "Events Emitted: \n"
            count = 1
            for x in i['eventsEmitted']:
                str += "\tEvent #%s\n" % count
                for key in x:
                    if key != "$class" and key != "eventID" and key != "timestamp":
                        capKey = key.capitalize()
                        str += "\t\t%s: %s\n" % (capKey, x[key])
                    elif key == "$class":
                        str += "\t\tType: %s\n" % x[key]
                    elif key == "eventID":
                        str += "\t\tID: %s\n" % x[key]
                    elif key == "timestamp":
                        dateKey = dateutil.parser.parse(x[key])
                        str += "\t\tTimestamp: %s\n" %dateKey.strftime("%m-%d-%Y %H:%M:%S")
        data.append(str)

    return data
