from Krow import Chain, Employer, Applicant, Job
import time
import dateutil.parser
import datetime

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

def request_hire(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST HIRE FIRE'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS

def request_hire_accept_fire(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST HIRE FIRE'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.request_hire_applicant(chain, applicant, job); print ("requested hired")    #WORKS
    applicant.accept_hire(chain, employer, job); print ("accepted")   #WORKS
    employer.fire_applicant(chain, applicant, job); print ("fired")    #WORKS

def request_unrequest(chain):
    '''STATUS: PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    applicant.unrequest_job(chain, employer, job); print ("unrequested")   #WORKS

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
