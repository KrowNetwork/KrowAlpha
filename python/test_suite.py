from Krow import Chain, Employer, Applicant, Job

def clear(chain):
    employer = Employer(open("sample_employer.json").read())
    applicant = Applicant(open("sample_applicant.json").read())
    job = Job(open("sample_job.json").read(), employer=employer)

    chain.put(employer)
    chain.put(applicant)
    chain.put(job)
    employer.post_job(chain, job)

def request_hire_fire(chain):   #'''PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST HIRE FIRE'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.hire_applicant(chain, applicant, job); print ("hired")    #WORKS
    employer.fire_applicant(chain, applicant, job); print ("fired")    #WORKS

def request_unrequest(chain):   '''PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST UNREQUEST'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    applicant.unrequest_job(chain, employer, job); print ("unrequested")   #WORKS

def request_deny(chain):    '''PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST DENY'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.deny_applicant(chain, applicant, job); print ("denied")   #WORKS

def request_deny_request(chain):    '''SEMI-PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST DENY REQUEST'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.deny_applicant(chain, applicant, job); print ("denied")   #WORKS
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS - SHOULD RETURN ERROR

def request_hire_resign(chain):    '''PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST HIRE RESIGN'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.hire_applicant(chain, applicant, job); print ("hired")    #WORKS
    applicant.resign_job(chain, employer, job); print ("resigned")    #WORKS

def request_hire_resign_fire(chain):    '''SEMI-PASS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST HIRE RESIGN FIRE'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.hire_applicant(chain, applicant, job); print ("hired")    #WORKS
    applicant.resign_job(chain, employer, job); print ("resigned")    #WORKS
    employer.fire_applicant(chain, applicant, job); print ("fired")    #WORKS SHOULD THROW ERROR BECAUSE THERE IS NO ONE TO FIRE

def request_hire_applicant_complete(chain):    '''FAILS'''
    clear(chain); print ('Cleared')

    applicant = chain.get_applicant("SAMPLEAPPLICANT"); print ('Got Applicant From Chain')
    employer = chain.get_employer("SAMPLEEMPLOYER"); print ('Got Employer From Chain')
    job = chain.get_job("SAMPLEJOB"); print ('Got Job From Chain')

    '''REQUEST HIRE APPLICANT COMPLETE'''
    applicant.request_job(chain, employer, job); print ("requested")   #WORKS
    employer.hire_applicant(chain, applicant, job); print ("hired")    #WORKS
    applicant.complete_job(chain, employer, job); print ("completed")    #NOT WRITTEN IN CODE
