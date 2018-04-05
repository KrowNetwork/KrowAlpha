"use strict";

var RATING_MIN = 0;
var RATING_MAX = 10;

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_REQUESTCOMPLETE = 8;
var JOB_CANCELLED = 16;

/**
 * @param {network.krow.transactions.employer.UpdateEmployer} updateEmployer - employer to be processed
 * @transaction
 */
function UpdateEmployer(updateEmployer)
{
	var factory = getFactory();
	var employer = updateEmployer.employer;

	employer.lastUpdated = new Date();

	return getParticipantRegistry('network.krow.participants.Employer')
		.then(function (participantRegistry){
			return participantRegistry.update(employer);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "EmployerChangedEvent");
			event.employer = employer;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.NewJob} newJob - NewJob to be processed
 * @transaction
 */
function NewJob(newJob)
{
	var factory = getFactory();
	var employer = newJob.employer;
	var job = newJob.job;

	job.created = new Date();
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
	var job = updateJob.job;

	job.lastUpdated = new Date();

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "UpdateJobEvent");
			event.employer = job.employer;
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

	if (job.hireRequests !== undefined)
	{
		for (var i = 0; i < job.hireRequests.length; i++)
		{
			var appl = job.hireRequests[i];
			for (var j = 0; i < appl.hireRequests.length; j++)
			{
				if (appl.hireRequests[i].jobID == job.jobID)
				{
					appl.hireRequests.split(j, 1);
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
	var applicant = requestHire.applicant;
	var job = requestHire.job;

	if(!jobAvailable(job))
		throw new Error("Unavailable");

	if(job.hireRequests === undefined)
		job.hireRequests = new Array();

	if (applicant.hireRequests === undefined)
		applicant.hireRequests = new Array();

	job.hireRequests.push(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));
	applicant.hireRequests.push(factory.newRelationship("network.krow.assets", "Job", job.jobID));

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
			var event = factory.newEvent("network.krow.transactions.employer", "RequestHireApplicantEvent");
			event.employer = job.employer;
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

	if (applicant.hireRequests !== undefined)
	{
		for (var i = 0; i < applicant.hireRequests.length; i++)
		{
			if (applicant.hireRequests[i].jobID == job.jobID)
			{
				applicant.hireRequests.split(i, 1);
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
			event.employer = job.employer;
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

	for (var i = 0; i < employer.inprogressJobs.length; i++)
	{
		if(employer.inprogressJobs[i].jobID == job.jobID)
		{
			employer.inprogressJobs.splice(i, 1);
			break;
		}
	}

	for (var i = 0; i < applicant.inprogressJobs.length; i++)
	{
		if(applicant.inprogressJobs[i].jobID == job.jobID)
		{
			applicant.inprogressJobs.splice(i, 1);
			break;
		}
	}

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
 * @param {network.krow.transactions.employer.CompleteJob} completeJob - job to be completed
 * @transaction
 */
function CompleteJob(completeJob)
{
	var factory = getFactory();
	var employer = completeJob.employer;
	var applicant = completeJob.applicant;
	var job = completeJob.job;

	if((job.flags & JOB_REQUESTCOMPLETE) != JOB_REQUESTCOMPLETE)
		throw new Error("Not Requested");

	if(job.employee.applicantID != applicant.applicantID || employer.inprogressJobs === undefined || applicant.inprogressJobs === undefined)
		throw new Error("Not Listed");

	if(employer.completedJobs === undefined)
		employer.completedJobs = new Array();
	if(applicant.completedJobs === undefined)
		applicant.completedJobs = new Array();

	for (var i = 0; i < employer.inprogressJobs.length; i++)
	{
		if(employer.inprogressJobs[i].jobID == job.jobID)
		{
			employer.inprogressJobs.splice(i, 1);
			break;
		}
	}

	for (var i = 0; i < applicant.inprogressJobs.length; i++)
	{
		if(applicant.inprogressJobs[i].jobID == job.jobID)
		{
			applicant.inprogressJobs.splice(i, 1);
			break;
		}
	}

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	employer.completedJobs.push(jobRef);
	applicant.completedJobs.push(jobRef);

	job.endDate = new Date();
	job.flags &= ~(JOB_OPEN | JOB_ACTIVE | JOB_REQUESTCOMPLETE);
	job.flags |= JOB_COMPLETE;

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
			var event = factory.newEvent("network.krow.transactions.employer", "CompleteJobEvent");
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
	var job = rateJob.job;
	var rating = rateJob.rating;

	if((job.flags & JOB_COMPLETE) != JOB_COMPLETE)
		throw new Error("Not Completed");

	if(job.rating !== undefined)
		rating.lastUpdated = new Date();

	if(rating.value < RATING_MIN)
		throw new Error("Value too low");
	if(rating.value > RATING_MAX)
		throw new Error("Value too high");

	//round to hundredths
	rating.value = Math.round(rating.value * 100) / 100;

	job.rating = rating;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "JobRatedEvent");
			event.employer = job.employer;
			event.applicant = job.employee;
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
	var job = unrateJob.job;
	var rating = job.rating;

	if(job.rating === undefined)
		throw new Error("No Rating");

	job.rating = null;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function () {
			var event = factory.newEvent("network.krow.transactions.employer", "JobUnrated");
			event.employer = job.employer;
			event.applicant = job.employee;
			event.job = job;
			emit(event);
		});
}

function jobAvailable(job)
{
	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE || (job.flags & JOB_COMPLETE) == JOB_COMPLETE || (job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		return false;
	return (job.flags & JOB_OPEN) == JOB_OPEN;
}
