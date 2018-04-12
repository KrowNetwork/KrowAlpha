"use strict";

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_REQUESTCOMPLETE = 8;
var JOB_CANCELLED = 16;

var DENIED_EXPIRE = 7 * 24 * 60 * 60 * 1000; //7 days

var NAME_REGEX = new RegExp(/^[\w ,.'-]+$/);

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
	validateModifyResume(applicant.resume);

	if(!NAME_REGEX.test(applicant.firstName))
		throw new Error("Invalid firstName: " + applicant.firstName);
	applicant.firstName = applicant.firstName.trim();

	if(!NAME_REGEX.test(applicant.lastName))
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

	//thrown, not returned
	validateModifyResume(resume);

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
	if(entity.country)
	{
		if(!/^[A-Za-z]{2,}$/.test(entity.country))
			throw new Error("Invalid country: " + entity.country);
		entity.country = entity.country.trim();
	}
	if(entity.state)
	{
		if(!NAME_REGEX.test(entity.state))
			throw new Error("Invalid state: " + entity.state);
		entity.state = entity.state.trim();
	}
	if(entity.city)
	{
		if(!NAME_REGEX.test(entity.city))
			throw new Error("Invalid city: " + entity.city);
		entity.city = entity.city.trim();
	}
	if(entity.address)
	{
		if(!NAME_REGEX.test(entity.address))
			throw new Error("Invalid address: " + entity.address);
		entity.address = entity.address.trim();
	}

	if(!/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(entity.email))
		throw new Error("Invalid email: " + entity.email);

	if(entity.phoneNumber)
		entity.phoneNumber = entity.phoneNumber.replace(/[^0-9+-]/g, "");

	return true;
}

function validateModifyResume(resume)
{
	if(resume.education !== undefined)
	{
		for (var i = 0; i < resume.education.length; i++)
			validateModifyResumeItem(resume.education[i]);
	}

	if(resume.skills !== undefined)
	{
		for (var i = 0; i < resume.skills.length; i++)
		{
			var skill = resume.skills[i].skill;
			if(!NAME_REGEX.test(skill))
				throw new Error("Invalid skill: " + skill);
			resume.skills[i].skill = skill.trim();
		}
	}

	if(resume.experience !== undefined)
	{
		for (var i = 0; i < resume.experience.length; i++)
		{
			validateModifyResumeItem(resume.experience[i]);

			if(resume.experience[i].position && !NAME_REGEX.test(resume.experience[i].position))
				throw new Error("Invalid position: " + resume.experience[i].position);
		}
	}

	if(resume.achievements !== undefined)
	{
		for (var i = 0; i < resume.achievements.length; i++)
			validateModifyResumeItem(resume.achievements[i]);
	}

	if(resume.affiliations !== undefined)
	{
		for (var i = 0; i < resume.affiliations.length; i++)
			validateModifyResumeItem(resume.affiliations[i]);
	}

	return true;
}

function validateModifyResumeItem(item)
{
	if(!NAME_REGEX.test(item.title))
		throw new Error("Invalid title: " + item.title);
	item.title = item.title.trim();

	var now = new Date();

	if(item.startDate !== undefined)
	{
		if(item.startDate > now)
			throw new Error("Invalid future date: " + item.startDate);
		if(item.endDate < item.startDate)
			throw new Error("Invalid date range: " + item.startDate + ", " + item.endDate);
	}

	if(item.endDate !== undefined)
	{
		if(item.endDate > now)
			throw new Error("Invalid future date: " + item.endDate);
		if(item.startDate === undefined)
			item.startDate = item.endDate;
	}

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
