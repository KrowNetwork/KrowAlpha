"use strict";

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_REQUESTCOMPLETE = 8;
var JOB_CANCELLED = 16;

var DENIED_EXPIRE = 7 * 24 * 60 * 60 * 1000; //7 days

/**
 * @param {network.krow.transactions.applicant.UpdateApplicant} tx - applicant to be processed
 * @transaction
 */
function UpdateApplicant(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;

	//thrown, not returned
	validateModifyEntity(applicant);

	var reg_name = new RegExp(/^[\w ,.'-]+$/);

	if(!reg_name.test(applicant.firstName))
		throw new Error("Invalid firstName: " + applicant.firstName);
	applicant.firstName = applicant.firstName.trim();

	if(!reg_name.test(applicant.lastName))
		throw new Error("Invalid lastName: " + applicant.lastName);
	applicant.lastName = applicant.lastName.trim();

	applicant.lastUpdated = new Date();

	return getParticipantRegistry('network.krow.participants.Applicant')
		.then(function (participantRegistry){
			return participantRegistry.update(applicant);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "ApplicantChangedEvent");
			event.applicant = applicant;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.UpdateResume} tx - updateResume to be processed
 * @transaction
 */
function UpdateResume(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;
	var resume = tx.resume;

	resume.lastUpdated = new Date();
	applicant.resume = resume;

	return getParticipantRegistry('network.krow.participants.Applicant')
		.then(function (participantRegistry){
			return participantRegistry.update(applicant);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "ResumeChangedEvent");
			event.applicant = applicant;
			event.resume = resume;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.RequestJob} tx - requestJob to be processed
 * @transaction
 */
function RequestJob(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;
	var job = tx.job;

	if(!jobAvailable(job))
		throw new Error("Unavailable");

	//check if applicant is currently denied a request
	if(job.deniedApplicants !== undefined && job.deniedApplicants.length > 0)
	{
		//update the denied applicants list
		var removed = updateDeniedApplicants(job);
		if(removed > 0)
		{
			//await!!!
			getAssetRegistry('network.krow.assets.Job')
				.then(function (assetRegistry){
					return assetRegistry.update(job);
				});
		}

		for (var i = 0; i < job.deniedApplicants.length; i++)
		{
			var denied = job.deniedApplicants[i];
			if(denied.applicantID == applicant.applicantID)
				throw new Error("\nDenied: " + denied.applicantID + "\nDate: " + denied.deniedDate + "\nReason: " + denied.reason);
		}
	}

	if(job.applicantRequests === undefined)
		job.applicantRequests = new Array();

	if(applicant.requestedJobs === undefined)
		applicant.requestedJobs = new Array();

	for (var i = 0; i < applicant.requestedJobs.length; i++)
	{
		if(applicant.requestedJobs[i].jobID == job.jobID)
			throw new Error("Already Requested");
	}

	job.applicantRequests.push(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));
	applicant.requestedJobs.push(factory.newRelationship("network.krow.assets", "Job", job.jobID));

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					participantRegistry.update(applicant);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "RequestJobEvent");
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.UnrequestJob} tx - unrequestJob to be processed
 * @transaction
 */
function UnrequestJob(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;
	var job = tx.job;

	//update denied applicants
	if(job.deniedApplicants !== undefined && job.deniedApplicants.length > 0)
	{
		//update the denied applicants list
		var removed = updateDeniedApplicants(job);
		if(removed > 0)
		{
			//await!!!
			getAssetRegistry('network.krow.assets.Job')
				.then(function (assetRegistry){
					return assetRegistry.update(job);
				});
		}
	}

	if(applicant.requestedJobs === undefined || job.applicantRequests === undefined || !job.applicantRequests.length)
		throw new Error("Not Listed");

	var removed = false;

	for (var i = 0; i < applicant.requestedJobs.length; i++)
	{
		if(applicant.requestedJobs[i].jobID == job.jobID)
		{
			applicant.requestedJobs.splice(i, 1);
			removed = true;
			break;
		}
	}

	if(!removed)
		throw new Error("Not Listed");

	for (var i = 0; i < job.applicantRequests.length; i++)
	{
		if(job.applicantRequests[i].applicantID == applicant.applicantID)
		{
			job.applicantRequests.splice(i, 1);
			break;
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
		.then(function (assetRegistry) {
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					participantRegistry.update(applicant);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "UnrequestJobEvent");
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.AcceptHire} tx
 * @transaction
 */
function AcceptHire(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

	if(job.hireRequests === undefined)
		throw new Error("Not Listed");

	var inlist = false;
	for (var i = 0; i < job.hireRequests.length; i++)
	{
		if(job.hireRequests[i].applicantID == applicant.applicantID)
		{
			inlist = true;
			break;
		}
	}

	if(!inlist || employer.availableJobs === undefined)
		throw new Error("Not Listed");

	if(employer.inprogressJobs === undefined)
		employer.inprogressJobs = new Array();

	if(applicant.inprogressJobs === undefined)
		applicant.inprogressJobs = new Array();

	for (var i = 0; i < employer.availableJobs.length; i++)
	{
		if(employer.availableJobs[i].jobID == job.jobID)
		{
			employer.availableJobs.splice(i, 1);
			break;
		}
	}

	for (var i = 0; i < applicant.hireRequests.length; i++)
	{
		if (applicant.hireRequests[i].jobID == job.jobID)
		{
			applicant.hireRequests.splice(i, 1);
			break;
		}
	}

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

	var updateApplicants = [applicant];

	if(job.applicantRequests !== undefined)
	{
		for (var i = 0; i < job.applicantRequests.length; i ++)
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

	job.applicantRequests = [];
	job.deniedApplicants = [];
	job.hireRequests = [];
	job.employee = factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID);
	job.startDate = new Date();
	job.flags |= JOB_ACTIVE;

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID)
	employer.inprogressJobs.push(jobRef);
	applicant.inprogressJobs.push(jobRef);

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					return participantRegistry.updateAll(updateApplicants);
				});
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Employer')
				.then(function (participantRegistry){
					return participantRegistry.update(employer);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "AcceptHireEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.ResignJob} tx - job to be resigned from
 * @transaction
 */
function ResignJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

	if(job.employee.applicantID != applicant.applicantID || applicant.inprogressJobs === undefined || employer.inprogressJobs === undefined)
		throw new Error("Not Listed");

	for (var i = 0; i < applicant.inprogressJobs.length; i++)
	{
		if(applicant.inprogressJobs[i].jobID == job.jobID)
		{
			applicant.inprogressJobs.splice(i, 1);
			break;
		}
	}

	for (var i = 0; i < employer.inprogressJobs.length; i++)
	{
		if(employer.inprogressJobs[i].jobID == job.jobID)
		{
			employer.inprogressJobs.splice(i, 1);
			break;
		}
	}

	if(applicant.terminatedJobs === undefined)
		applicant.terminatedJobs = new Array();

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	applicant.terminatedJobs.push(jobRef);
	employer.availableJobs.push(jobRef);

	job.startDate = null;
	job.flags &= ~JOB_ACTIVE;
	job.employee = null;

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
			return getParticipantRegistry('network.krow.participants.Employer')
				.then(function (participantRegistry){
					return participantRegistry.update(employer);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "ResignJobEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.RequestCompleteJob} tx - job to be marked completed
 * @transaction
 */
function RequestCompleteJob(tx)
{
	var factory = getFactory();
	var job = tx.job;

	job.flags |= JOB_REQUESTCOMPLETE;
	job.requestCompletedDate = new Date();

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry) {
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "RequestCompleteJobEvent");
			event.employer = job.employer;
			event.applicant = job.employee;
			event.job = job;
			emit(event);
		});
}

function validateModifyEntity(entity)
{
	if(entity.country && !/^[A-Za-z]{2,}$/.test(entity.country))
		throw new Error("Invalid country: " + entity.country);
	if(entity.state && !/^[\w ,.'-]+$/.test(entity.state))
		throw new Error("Invalid state: " + entity.state);
	if(entity.city && !/^[\w ,.'-]+$/.test(entity.city))
		throw new Error("Invalid city: " + entity.city);
	if(entity.address && !/^[\w ,.'-]+$/.test(entity.address))
		throw new Error("Invalid address: " + entity.address);

	if(!/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(entity.email))
		throw new Error("Invalid email: " + entity.email);

	return true;
}

function updateDeniedApplicants(job)
{
	var denied = job.deniedApplicants;
	var removed = 0;
	var date = new Date();

	for (var i = 0; i < denied.length; i++)
	{
		if(date - denied[i].deniedDate >= DENIED_EXPIRE)
		{
			denied.splice(i--, 1);
			removed++;
		}
	}

	return removed;
}

function jobAvailable(job)
{
	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE || (job.flags & JOB_COMPLETE) == JOB_COMPLETE || (job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		return false;
	return (job.flags & JOB_OPEN) == JOB_OPEN;
}
