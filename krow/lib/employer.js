"use strict";

var RATING_MIN = 0;
var RATING_MAX = 10;

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_REQUESTCOMPLETE = 8;
var JOB_CANCELLED = 16;

var NAME_REGEX = new RegExp(/^[\w ,.'-]+$/);

/**
 * @param {network.krow.transactions.employer.UpdateEmployer} tx - employer to be processed
 * @transaction
 */
function UpdateEmployer(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var upd = tx.updateEmployer;

	var copyfield = [
		"employerName",
		"description",
		"country",
		"state",
		"city",
		"address",
		"email",
		"phoneNumber",
		"links"
	];

	for (var i = 0, len = copyfield.length; i < len; i++)
	{
		var c = copyfield[i];
		if(upd[c] !== undefined)
			employer[c] = upd[c];
	}

	//thrown, not returned
	validateModifyEntity(employer);

	if(!NAME_REGEX.test(employer.employerName))
		throw new Error("Invalid employerName: " + employer.employerName);
	employer.employerName = employer.employerName.trim();

	employer.description = employer.description.trim();

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
 * @param {network.krow.transactions.employer.NewJob} tx - NewJob to be processed
 * @transaction
 */
function NewJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var newJob = tx.newJob;

	if(newJob.title === undefined || newJob.description === undefined || newJob.tags === undefined || newJob.tags.length == 0 || newJob.payment === undefined)
		throw new Error("Missing required fields");

	var id = randomID(16);
	var job = factory.newResource("network.krow.assets", "Job", employer.employerID + "_JOB" + id);

	job.title = newJob.title;
	job.description = newJob.description;
	job.tags = newJob.tags;
	job.payment = newJob.payment;

	job.created = new Date();
	job.flags = JOB_OPEN;

	//thrown, not returned
	validateModifyJob(job);

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
					return assetRegistry.add(job);
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
 * @param {network.krow.transactions.employer.UpdateJob} tx - UpdateJob to be processed
 * @transaction
 */
function UpdateJob(tx)
{
	var factory = getFactory();
	var job = tx.job;
	var upd = tx.updateJob;

	var copyfield = [
		"title",
		"description",
		"tags",
		"payment"
	];

	for (var i = 0, len = copyfield.length; i < len; i++)
	{
		var c = copyfield[i];
		if(upd[c] !== undefined)
			job[c] = upd[c];
	}

	//thrown, not returned
	validateModifyJob(job);

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
 * @param {network.krow.transactions.employer.RemoveJob} tx - RemoveJob to be processed
 * @transaction
 */
function RemoveJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var job = tx.job;

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
 * @param {network.krow.transactions.employer.RequestHireApplicant} tx - requestHire to be processed
 * @transaction
 */
function RequestHireApplicant(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;
	var job = tx.job;

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
 * @param {network.krow.transactions.employer.DenyApplicant} tx - denyApplicant to be processed
 * @transaction
 */
function DenyApplicant(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;
	var job = tx.job;
	var reason = tx.reason;

	if(job.applicantRequests === undefined)
		throw new Error("Not Listed");

	var requested = false;
	for (var i = 0; i < job.applicantRequests.length; i++)
	{
		if(job.applicantRequests[i].applicantID == applicant.applicantID)
		{
			requested = true;
			job.applicantRequests.splice(i, 1);
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
 * @param {network.krow.transactions.employer.FireApplicant} tx - fireApplicant to be processed
 * @transaction
 */
function FireApplicant(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

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
 * @param {network.krow.transactions.employer.CompleteJob} tx - job to be completed
 * @transaction
 */
function CompleteJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

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
 * @param {network.krow.transactions.employer.RateJob} tx - rateJob to be processed
 * @transaction
 */
function RateJob(tx)
{
	var factory = getFactory();
	var job = tx.job;
	var rating = tx.rating;

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
 * @param {network.krow.transactions.employer.UnrateJob} tx - unrateJob to be processed
 * @transaction
 */
function UnrateJob(tx)
{
	var factory = getFactory();
	var job = tx.job;
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

function validateModifyJob(job)
{
	if(!NAME_REGEX.test(job.title))
		throw new Error("Invalid title: " + job.title);
	job.title = job.title.trim();

	job.description = job.description.trim();

	var tagmap = {};

	for (var i = 0; i < job.tags.length; i++)
	{
		var tag = job.tags[i];

		if(NAME_REGEX.test(tag))
			throw new Error("Invalid tag: " + tag);

		if(tagmap[tag] === true)
		{
			job.tags.splice(i--, 1);
			continue;
		}

		job.tags[i] = tag.trim();
		tagmap[tag] = true;
	}

	if(job.payment < 0)
		throw new Error("Invalid payment");

	return true;
}

function randomID(length)
{
	var RANDOMSPACE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var id = "";

	//totally super secure random
	for (var i = 0; i < length; i++)
		id += RANDOMSPACE[(Math.random() * RANDOMSPACE.length) >> 0];

	return id;
}

function jobAvailable(job)
{
	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE || (job.flags & JOB_COMPLETE) == JOB_COMPLETE || (job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		return false;
	return (job.flags & JOB_OPEN) == JOB_OPEN;
}
