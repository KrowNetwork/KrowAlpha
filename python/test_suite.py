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
    job = Job(open("sample_job.json").read(), employer=employer)

    chain.post(employer)
    chain.post(applicant)
    # chain.post(job)
    employer.post_job(chain, json.load(open("intermediate_job.json")))
    logging.info("samples created")

def delete_samples(chain):
    chain.delete('employer', "SAMPLEEMPLOYER")
    chain.delete('applicant', 'SAMPLEAPPLICANT')
    chain.delete('job', 'SAMPLEJOB')
    logging.info("samples created")


def get_samples(chain, get_job=True):
    applicant = chain.get_applicant("SAMPLEAPPLICANT")
    employer = chain.get_employer("SAMPLEEMPLOYER")
    job = None
    if get_job:
        jID = employer.get_avaliable_job_IDs()[0]
        job = chain.get_job(jID)
    logging.info("got samples from chain")

    return applicant, employer, job

def get_samples_from_file(folder):

    applicant = json.load(open("%ssample_applicant.json" % folder))
    employer = json.load(open("%ssample_employer.json" % folder))
    job = json.load(open("%ssample_job.json" % folder))

    return applicant, employer, job

def write_to_file(chain, folder):
    applicant, employer, job = get_samples(chain)
    with open("%s%s" % (folder, "sample_applicant.json"), 'w') as F:
        json.dump(applicant.data, F)
    with open("%s%s" % (folder, "sample_employer.json"), 'w') as F:
        json.dump(employer.data, F)
    with open("%s%s" % (folder, "sample_job.json"), 'w') as F:
        json.dump(job.data, F)
    logging.info("Data written to %s" % folder)

def test_1(chain, location, write=False):
    # Applicant requests job
    POPLIST_A = ["created"]
    POPLIST_E = ["created"]
    POPLIST_J = ["created"]

    res = {
            "applicant": PASS,
            "employer": PASS,
            "job": PASS,
          }

    clear(chain)
    applicant, employer, job = get_samples(chain, get_job=True)

    logging.info("running test")
    applicant.request_job(chain, job)
    logging.info("test completed")

    if write:
        write_to_file(chain, 'results/test_1/')

    else:
        applicant, employer, job = get_samples(chain, get_job=True)
        applicant_, employer_, job_ = get_samples_from_file(location)
        POPDICT = {
                    applicant: [applicant_, POPLIST_A],
                    employer: [employer_, POPLIST_E],
                    job: [job, POPLIST_J],
                  }

        for i in POPDICT:
            for a in POPDICT[i][-1]:
                POPDICT[i][0].pop(a, None)
                i.data.pop(a, None)

        if applicant != applicant_:
            res['applicant'] = FAIL
        if employer != employer_:
            res['employer'] = FAIL
        if job != job_:
            res['job'] = FAIL

    return res
