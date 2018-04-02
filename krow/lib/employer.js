"use strict";

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_CANCELLED = 8;

/**
 * @param {network.krow.transactions.employer.NewJob} newJob - NewJob to be processed
 * @transaction
 */
function NewJob(newJob)
{
	var factory = getFactory();
	var employer = newJob.employer;
	var job = newJob.job;

	job.postDate = new Date();
	job.flags = JOB_OPEN;

	if(employer.availableJobs === undefined)
		employer.availableJobs = new Array();

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	employer.availableJobs.push(jobRef);

	return getParticipantRegistry('network.krow.participants.Employer')
		.then(function (participantRegistry){
			return participantRegistry.update(employer);
		})
		.then(function (){
			return getAssetRegistry('network.krow.assets.Job')
				.then(function (assetRegistry){
					return assetRegistry.update(job);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "NewJobEvent");
			event.employer = employer;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.UpdateJob} updateJob - UpdateJob to be processed
 * @transaction
 */
function UpdateJob(updateJob)
{
	var factory = getFactory();
	var employer = updateJob.employer;
	var job = updateJob.job;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "UpdateJobEvent");
			event.employer = employer;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.RemoveJob} removeJob - RemoveJob to be processed
 * @transaction
 */
function RemoveJob(removeJob)
{
	var factory = getFactory();
	var employer = removeJob.employer;
	var job = removeJob.job;

	if((job.flags & JOB_COMPLETE) == JOB_CANCELLED)
		throw new Error("Already Cancelled");
	if((job.flags & JOB_COMPLETE) == JOB_COMPLETE)
		throw new Error("Already Completed");

	for (var i = 0; i < employer.availableJobs.length; i++)
	{
		if(employer.availableJobs[i].jobID == job.jobID)
		{
			employer.availableJobs.splice(i, 1);
			break;
		}
	}

	if(employer.terminatedJobs === undefined)
		employer.terminatedJobs = new Array();
	employer.terminatedJobs.push(factory.newRelationship("network.krow.assets", "Job", job.jobID));

	var updateApplicants = [];

	if(job.applicantRequests !== undefined)
	{
		for (var i = 0; i < job.applicantRequests.length; i++)
		{
			var appl = job.applicantRequests[i];
			for (var j = 0; j < appl.requestedJobs.length; j++)
			{
				if(appl.requestedJobs[j].jobID == job.jobID)
				{
					appl.requestedJobs.splice(j, 1);
					break;
				}
			}
			updateApplicants.push(appl);
		}
	}

	//handled in FireApplicant, otherwise it would override before firing
	//job.employee = null;

	job.endDate = new Date();

	//must not change JOB_ACTIVE for FireApplicant
	job.flags &= ~JOB_OPEN;
	job.flags |= JOB_CANCELLED;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			getParticipantRegistry('network.krow.participants.Employer')
				.then(function (participantRegistry){
					return participantRegistry.update(employer);
				});
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					if((job.flags & JOB_ACTIVE) == JOB_ACTIVE)
					{
						//fire the currently working employee
						return FireApplicant({
							"employer": employer,
							"applicant": job.employee,
							"job": job
						});
					}

					//should not be updated if active because request list is empty
					return participantRegistry.updateAll(updateApplicants);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "JobRemovedEvent");
			event.employer = employer;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.RequestHireApplicant} requestHire - requestHire to be processed
 * @transaction
 */
function RequestHireApplicant(requestHire)
{
	var factory = getFactory();
	var employer = requestHire.employer;
	var applicant = requestHire.applicant;
	var job = requestHire.job;

	if(!jobAvailable(job))
		throw new Error("Unavailable");

	if(job.hireRequests === undefined)
		job.hireRequests = new Array();
	job.hireRequests(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "RequestHireApplicantEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.DenyApplicant} denyApplicant - denyApplicant to be processed
 * @transaction
 */
function DenyApplicant(denyApplicant)
{
	var factory = getFactory();
	var employer = denyApplicant.employer;
	var applicant = denyApplicant.applicant;
	var job = denyApplicant.job;
	var reason = denyApplicant.reason;

	if(job.applicantRequests === undefined)
		throw new Error("Not Listed");

	var requested = false;
	for (var i = 0; i < job.applicantRequests.length; i++)
	{
		if(job.applicantRequests[i].applicantID == applicant.applicantID)
		{
			requested = true;
			break;
		}
	}

	if(!requested)
		throw new Error("Not Listed");

	if(job.deniedApplicants === undefined)
		job.deniedApplicants = new Array();

	var deniedConcept = factory.newConcept('network.krow.assets', 'DeniedApplicant');
	deniedConcept.applicantID = applicant.applicantID;
	deniedConcept.deniedDate = new Date();
	deniedConcept.reason = reason;

	job.deniedApplicants.push(deniedConcept);

	if(applicant.requestedJobs !== undefined)
	{
		for (var i = 0; i < applicant.requestedJobs.length; i++)
		{
			if(applicant.requestedJobs[i].jobID == job.jobID)
			{
				applicant.requestedJobs.splice(i, 1);
				break;
			}
		}
	}

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					return participantRegistry.update(applicant);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "DenyApplicantEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.FireApplicant} fireApplicant - fireApplicant to be processed
 * @transaction
 */
function FireApplicant(fireApplicant)
{
	var factory = getFactory();
	var employer = fireApplicant.employer;
	var applicant = fireApplicant.applicant;
	var job = fireApplicant.job;

	if((job.flags & JOB_ACTIVE) != JOB_ACTIVE)
		throw new Error("Not Active");

	if(job.employee.applicantID != applicant.applicantID || employer.inprogressJobs === undefined || applicant.inprogressJobs === undefined)
		throw new Error("Not Listed");

	if(employer.terminatedJobs === undefined)
		employer.terminatedJobs = new Array();
	if(applicant.terminatedJobs === undefined)
		applicant.terminatedJobs = new Array();

	removeInprogressJob(applicant, job);
	removeInprogressJob(employer, job);

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	employer.availableJobs.push(jobRef);
	applicant.terminatedJobs.push(jobRef);

	job.startDate = null;
	job.employee = null;
	job.flags &= ~JOB_ACTIVE;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Employer')
				.then(function (participantRegistry){
					return participantRegistry.update(employer);
				});
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					return participantRegistry.update(applicant);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "FireApplicantEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.RateJob} RateJob - rateJob to be processed
 * @transaction
 */
function RateJob(rateJob)
{
	var factory = getFactory();
	var employer = rateJob.employer;
	var applicant = rateJob.applicant;
	var job = rateJob.job;
	var rating = rateJob.rating;

	rating.hasEmployerConfirmation = true; // set to true because the employer is the one sending in the transaction

	if (rating.hasApplicantConfirmation == false)
		throw new Error("Rating does not have applicant confirmation");

	job.rating = rating;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "JobRated");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.UnrateJob} unrateJob - unrateJob to be processed
 * @transaction
 */
function UnrateJob(unrateJob)
{
	var factory = getFactory();
	var employer = unrateJob.employer;
	var applicant = unrateJob.applicant;
	var job = unrateJob.job;
	var rating = job.rating;

	rating.hasEmployerConfirmationForRemoval = true; // set to true because the employer is the one sending in the transaction

	if(unrateJob.hasApplicantConfirmationForRemoval == false)
		throw new Error("Rating does not have applicant confirmation for removal");

	job.rating = rating;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function () {
			var event = factory.newEvent("network.krow.transactions.employer", "JobUnrated");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

function removeInprogressJob(participant, job)
{
	for (var i = 0; i < participant.inprogressJobs.length; i++)
	{
		if(participant.inprogressJobs[i].jobID == job.jobID)
		{
			participant.inprogressJobs.splice(i, 1);
			break;
		}
	}
}

function jobAvailable(job)
{
	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE || (job.flags & JOB_COMPLETE) == JOB_COMPLETE || (job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		return false;
	return (job.flags & JOB_OPEN) == JOB_OPEN;
}
