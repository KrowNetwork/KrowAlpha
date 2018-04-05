from Krow import Chain, Employer, Applicant, Job
import time
import dateutil.parser
import datetime
import json

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

def create_samples(chain):
    employer = Employer(open("sample_employer.json").read())
    applicant = Applicant(open("sample_applicant.json").read())
    job = Job(open("sample_job.json").read(), employer=employer)

    chain.post(employer)
    chain.post(applicant)
    chain.post(job)
    employer.post_job(chain, job)

def delete_samples(chain):
    chain.delete('employer', "SAMPLEEMPLOYER")
    chain.delete('applicant', 'SAMPLEAPPLICANT')
    chain.delete('job', 'SAMPLEJOB')

def get_samples(chain):
    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    return applicant, employer, job

def test_all(chain, locations):
    res = {
            "test_1": None,
            "test_2": None,
          }

    res['test_1'] = test_1(chain, locations[0])
    res['test_2'] = test_2(chain, locations[1])
    res['test_3'] = test_3(chain, locations[2])

    return res

'''TESTS:
    test_1 -> Applicant requests job, employer requests to hire
    test_2 -> Applicant requests job, employer requests to hire, applicant accepts, employer fires

'''

def test_1(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain); print ('Cleared')

    applicant, employer, job = get_samples(chain)

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS

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

    return res

def test_2(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain); print ('Cleared')

    applicant, employer, job = get_samples(chain)

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS
    applicant.accept_hire(chain, employer, job); print ("accepted hire")    #WORKS
    employer.fire_applicant(chain, applicant, job); print ("fired")    #WORKS

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

    return res

def test_3(chain, location):
    '''STATUS: PASS'''
    res = {
            "Applicant": PASS,
            "Employer": PASS,
            "Job": PASS
          }

    clear(chain); print ('Cleared')

    applicant, employer, job = get_samples(chain)

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    applicant.unrequest_job(chain, employer, job); print ("unrequested")   #WORKS

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

    return res

def request_deny(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.deny_applicant(chain, applicant, job); print ("denied")   #WORKS

def request_deny_request(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.deny_applicant(chain, applicant, job); print ("denied")   #WORKS
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS

def request_hire_accept(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS
    applicant.accept_hire(chain, employer, job); print ("accepted")   #WORKS


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
