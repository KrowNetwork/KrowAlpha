from Krow import Chain, Employer, Applicant, Job, JSONError
import time
import dateutil.parser
import datetime
import json
import logging

logging.basicConfig(level=logging.INFO)


FAIL = "fail"
PASS = "pass"

'''Tests:
    Test 1: Applicant requests a job
    Test 2: Applicant requests a job, then unrequests
    Test 3: Applicant requests a job, employer requests to hire
    Test 4: Applicant requests a job, employer requests to hire, employer unrequests to hire
    Test 5: Applicant requests a job, employer requests to hire, applicant unrequests the job
    Test 6: Applicant requests a job, employer requests to hire, applicant accepts
    Test 7: Applicant requests a job, employer requests to hire, applicant accepts, applicant resigns
    Test 8: Applicant requests a job, employer requests to hire, applicant accepts, employer fires
    Test 9: Applicant requests a job, employer requests to hire, applicant accepts, applicant requests to complete, employer accepts
    Test 10: Applicant requests a job, employer requests to hire, applicant accepts, applicant requests to complete, employer rejects applicant request to complete
    Test 11: Employer endorses skill
    Test 12: Employer endorses skill, employer unendorses skill
    Test 13: Applicant updates resume
'''

def clear(chain):
    employer = Employer(open("sample_employer.json").read())
    applicant = Applicant(open("sample_applicant.json").read())

    chain.put(employer)
    chain.put(applicant)
    # chain.put(job)
    employer.post_job(chain, json.load(open("intermediate_job.json")))
    logging.info("samples reset")

def create_samples(chain):
    employer = Employer(open("sample_employer.json").read())
    applicant = Applicant(open("sample_applicant.json").read())

    chain.post(employer)
    chain.post(applicant)
    # chain.post(job)
    employer.post_job(chain, json.load(open("intermediate_job.json")))
    logging.info("samples created")

def delete_samples(chain):
    chain.delete('employer', "SAMPLEEMPLOYER")
    chain.delete('applicant', 'SAMPLEAPPLICANT')
    # chain.delete('job', 'SAMPLEJOB')
    logging.info("samples deleted")

def get_samples(chain, get_job=True, list="availableJobs"):
    applicant = chain.get_applicant("SAMPLEAPPLICANT")
    employer = chain.get_employer("SAMPLEEMPLOYER")
    job = None
    if get_job:
        jID = employer.data[list][0].split("#")[-1]
        job = chain.get_job(jID)
    logging.info("got samples from chain")

    return applicant, employer, job

def get_samples_from_file(folder):

    applicant = json.load(open("%ssample_applicant.json" % folder))
    employer = json.load(open("%ssample_employer.json" % folder))
    job = json.load(open("%ssample_job.json" % folder))

    return applicant, employer, job

def write_to_file(chain, folder, list="availableJobs"):
    applicant, employer, job = get_samples(chain, get_job=True, list=list)
    with open("%s%s" % (folder, "sample_applicant.json"), 'w') as F:
        json.dump(applicant.data, F)
    with open("%s%s" % (folder, "sample_employer.json"), 'w') as F:
        json.dump(employer.data, F)
    with open("%s%s" % (folder, "sample_job.json"), 'w') as F:
        json.dump(job.data, F)
    logging.info("Data written to %s" % folder)

def write_all_data(chain):
    logging.info("writing data")
    test_1(chain, "results/test_1/", write=True)
    test_2(chain, "results/test_2/", write=True)
    test_3(chain, "results/test_3/", write=True)
    test_4(chain, "results/test_4/", write=True)
    test_5(chain, "results/test_5/", write=True)
    test_6(chain, "results/test_6/", write=True)
    test_7(chain, "results/test_7/", write=True)
    test_8(chain, "results/test_8/", write=True)
    test_9(chain, "results/test_9/", write=True)
    test_10(chain, "results/test_10/", write=True)
    test_11(chain, "results/test_11/", write=True)
    test_12(chain, "results/test_12/", write=True)
    test_13(chain, "results/test_13/", write=True)
    logging.info("finished")

def test_all(chain):
    logging.info("testing all")
    returns = []
    returns.append(test_1(chain, "results/test_1/", write=False))
    returns.append(test_2(chain, "results/test_2/", write=False))
    returns.append(test_3(chain, "results/test_3/", write=False))
    returns.append(test_4(chain, "results/test_4/", write=False))
    returns.append(test_5(chain, "results/test_5/", write=False))
    returns.append(test_6(chain, "results/test_6/", write=False))
    returns.append(test_7(chain, "results/test_7/", write=False))
    returns.append(test_8(chain, "results/test_8/", write=False))
    returns.append(test_9(chain, "results/test_9/", write=False))
    returns.append(test_10(chain, "results/test_10/", write=False))
    returns.append(test_11(chain, "results/test_11/", write=False))
    returns.append(test_12(chain, "results/test_12/", write=False))
    returns.append(test_13(chain, "results/test_13/", write=False))
    logging.info("finished")
    return returns

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

def test_1(chain, location, write=False):
    # Applicant requests job
    POPLIST_A = ["created", "requestedJobs"]
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_1")
    applicant.request_job(chain, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_1/')

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True)
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_app_requests = True if applicant.data['requestedJobs'][0].split("#")[-1] == job.ID else False
        job_in_emp_available_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or job_in_app_requests == False:
            res['applicant'] = FAIL
        if employer.data != employer_ or job_in_emp_available_jobs == False:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_2(chain, location, write=False):
    # Applicant requests then unrequests job
    POPLIST_A = ["created"]
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_2")
    applicant.request_job(chain, job)
    applicant.unrequest_job(chain, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_2/')

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True)
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_available_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_:
            res['applicant'] = FAIL
        if employer.data != employer_ or job_in_emp_available_jobs == False:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_3(chain, location, write=False):
    # Applicant requests a job, employer requests to hire
    POPLIST_A = ["created", 'requestedJobs', 'hireRequests']
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_3")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_3/')

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True)
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_app_requests = True if applicant.data['requestedJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_hire_requests = True if applicant.data['hireRequests'][0].split("#")[-1] == job.ID else False
        job_in_emp_available_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_requests or not job_in_app_hire_requests:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_available_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_4(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, employer unrequests to hire
    POPLIST_A = ["created", 'requestedJobs']
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_4")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    employer.unrequest_hire_applicant(chain, applicant, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_4/')

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True)
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_app_requests = True if applicant.data['requestedJobs'][0].split("#")[-1] == job.ID else False
        job_in_emp_available_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_requests:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_available_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_5(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, applicant unrequests the job
    POPLIST_A = ["created"]
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_5")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.unrequest_job(chain, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_5/')

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True)
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_available_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_available_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_6(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, applicant accepts
    POPLIST_A = ["created", 'inprogressJobs']
    POPLIST_E = ["created", "inprogressJobs"]
    POPLIST_J = ["created", "jobID", "startDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_6")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_6/', list="inprogressJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="inprogressJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_inprogress_jobs = True if employer.data['inprogressJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_inprogress_jobs = True if applicant.data['inprogressJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_inprogress_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_inprogress_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_7(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, applicant accepts, applicant resigns
    POPLIST_A = ["created", "terminatedJobs"]
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID", "startDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_7")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    applicant.resign_job(chain, employer, job, reason="Text")
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_7/', list="availableJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="availableJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_inprogress_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_inprogress_jobs = True if applicant.data['terminatedJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_inprogress_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_inprogress_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res


def test_8(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, applicant accepts, employer fires
    POPLIST_A = ["created", "terminatedJobs"]
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID", "startDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_8")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    employer.fire_applicant(chain, applicant, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_8/', list="availableJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="availableJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_inprogress_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_inprogress_jobs = True if applicant.data['terminatedJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_inprogress_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_inprogress_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_9(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, applicant accepts, applicant requests to complete, employer accepts
    POPLIST_A = ["created", "completedJobs"]
    POPLIST_E = ["created", "completedJobs"]
    POPLIST_J = ["created", "jobID", "startDate", "endDate", "requestCompletedDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_9")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    applicant.request_complete_job(chain, job)
    employer.accept_complete_job(chain, applicant, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_9/', list="completedJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="completedJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_completed_jobs = True if employer.data['completedJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_completed_jobs = True if applicant.data['completedJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_completed_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_completed_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_10(chain, location, write=False):
    # Applicant requests a job, employer requests to hire, applicant accepts, applicant requests to complete, employer rejects applicant request to complete
    POPLIST_A = ["created", "inprogressJobs"]
    POPLIST_E = ["created", "inprogressJobs"]
    POPLIST_J = ["created", "jobID", "startDate", "endDate", "requestCompletedDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_10")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    applicant.request_complete_job(chain, job)
    employer.deny_request_complete(chain, applicant, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_10/', list="inprogressJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="inprogressJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_inprogress_jobs = True if employer.data['inprogressJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_inprogress_jobs = True if applicant.data['inprogressJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_emp_inprogress_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_inprogress_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_11(chain, location, write=False):
    # Employer endorses skill
    POPLIST_A = ["created", "completedJobs"]
    POPLIST_E = ["created", "completedJobs"]
    POPLIST_J = ["created", "jobID", "startDate", "endDate", "requestCompletedDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_11")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    applicant.request_complete_job(chain, job)
    employer.accept_complete_job(chain, applicant, job)
    employer.endorse_skill(chain, applicant, skill="Python")
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_11/', list="completedJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="completedJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_completed_jobs = True if employer.data['completedJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_completed_jobs = True if applicant.data['completedJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_completed_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_completed_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_12(chain, location, write=False):
    # Employer endorses skill, then unendorses
    POPLIST_A = ["created", "completedJobs"]
    POPLIST_E = ["created", "completedJobs"]
    POPLIST_J = ["created", "jobID", "startDate", "endDate", "requestCompletedDate"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test_12")
    applicant.request_job(chain, job)
    employer.request_hire_applicant(chain, applicant, job)
    applicant.accept_hire(chain, employer, job)
    applicant.request_complete_job(chain, job)
    employer.accept_complete_job(chain, applicant, job)
    employer.endorse_skill(chain, applicant, skill="Python")
    employer.unendorse_skill(chain, applicant, skill="Python")
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_12/', list="completedJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="completedJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_completed_jobs = True if employer.data['completedJobs'][0].split("#")[-1] == job.ID else False
        job_in_app_completed_jobs = True if applicant.data['completedJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant.data != applicant_ or not job_in_app_completed_jobs:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_completed_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res

def test_13(chain, location, write=False):
    # applicant updates resume
    POPLIST_A = ["created", "availableJobs", "resumeLastUpdated"]
    POPLIST_E = ["created", "availableJobs"]
    POPLIST_J = ["created", "jobID"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)
    resume = json.load(open("sample_update_resume.json"))
    logging.info("running test_13")
    applicant.update_resume(chain, resume)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_13/', list="availableJobs")

    else:
        logging.info("checking results")
        applicant, employer, job = get_samples(chain, get_job=True, list="availableJobs")
        applicant_, employer_, job_ = get_samples_from_file(location)

        job_in_emp_available_jobs = True if employer.data['availableJobs'][0].split("#")[-1] == job.ID else False

        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job_, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                if a == "resumeLastUpdated":
                    POPDICT[i][0]['resume'].pop("lastUpdated", None)
                    i.data['resume'].pop("lastUpdated", None)
                else:
                    POPDICT[i][0].pop(a, None)
                    i.data.pop(a, None)

        if applicant.data != applicant_:
            res['applicant'] = FAIL
        if employer.data != employer_ or not job_in_emp_available_jobs:
            res['employer'] = FAIL
        if job.data != job_:
            res['job'] = FAIL

    return res
