"use strict";

var MAX_AVAILABLEJOBS = 100;
var MAX_TAGS = 20;

/**
 * @param {network.krow.transactions.employer.UpdateEmployer} tx - employer to be processed
 * @transaction
 */
async function UpdateEmployer(tx)
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
		throw new RestError(errno.EINVAL, "Invalid employerName: " + employer.employerName);
	employer.employerName = employer.employerName.trim();

	employer.description = employer.description.trim();

	employer.lastUpdated = new Date();

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var event = factory.newEvent("network.krow.transactions.employer", "EmployerChangedEvent");
	event.employer = employer;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.NewJob} tx - NewJob to be processed
 * @transaction
 */
async function NewJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var newJob = tx.newJob;

	var copyfield = [
		"title",
		"description",
		"tags",
		"payment",
		"paymentType"
	];

	for (var i = 0, len = copyfield.length; i < len; i++)
	{
		var c = copyfield[i];
		if(newJob[c] === undefined)
			throw new RestError(errno.EINVAL, "Missing required fields: " + c);
	}

	if(employer.availableJobs !== undefined && employer.availableJobs.length > MAX_AVAILABLEJOBS)
		throw new RestError(errno.ELIMIT, "Too many available jobs (max " + MAX_AVAILABLEJOBS + ")");

	//thrown, not returned
	validateModifyJob(job);

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');

	var id = null;

	//get unique id
	while(true)
	{
		id = employer.employerID + "_JOB" + randomID(16);

		try
		{
			await jobRegistry.get(id);
		}catch(err)
		{
			break;
		}
	}

	var job = factory.newResource("network.krow.assets", "Job", id);

	for (var i = 0, len = copyfield.length; i < len; i++)
	{
		var c = copyfield[i];
		job[c] = newJob[c];
	}

	job.employer = factory.newRelationship("network.krow.participants", "Employer", employer.employerID);
	job.created = new Date();
	job.flags = JOB_OPEN;

	if(employer.availableJobs === undefined)
		employer.availableJobs = [];

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	employer.availableJobs.push(jobRef);

	await jobRegistry.add(job);

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var event = factory.newEvent("network.krow.transactions.employer", "NewJobEvent");
	event.employer = employer;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.UpdateJob} tx - UpdateJob to be processed
 * @transaction
 */
async function UpdateJob(tx)
{
	var factory = getFactory();
	var job = tx.job;
	var upd = tx.updateJob;

	var copyfield = [
		"title",
		"description",
		"tags",
		"payment",
		"paymentType"
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

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var event = factory.newEvent("network.krow.transactions.employer", "UpdateJobEvent");
	event.employer = job.employer;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.RemoveJob} tx - RemoveJob to be processed
 * @transaction
 */
async function RemoveJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var job = tx.job;

	if(job.employer.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if((job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		throw new RestError(errno.EALREADY);
	if((job.flags & JOB_COMPLETE) == JOB_COMPLETE)
		throw new RestError(errno.EALREADY);

	for (var i = 0; i < employer.availableJobs.length; i++)
	{
		if(employer.availableJobs[i].jobID == job.jobID)
		{
			employer.availableJobs.splice(i, 1);
			break;
		}
	}

	if(employer.terminatedJobs === undefined)
		employer.terminatedJobs = [];
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

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');

	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE)
	{
		//fire the currently working employee
		await FireApplicant({
			"employer": employer,
			"applicant": job.employee,
			"job": job,
			"reason": "Job was removed"
		});
	}else
	{
		//should not be updated if active because request list is empty
		await applicantRegistry.updateAll(updateApplicants);
	}

	var event = factory.newEvent("network.krow.transactions.employer", "JobRemovedEvent");
	event.employer = employer;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.RequestHireApplicant} tx - requestHire to be processed
 * @transaction
 */
async function RequestHireApplicant(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

	if(job.employer.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if(!jobAvailable(job))
		throw new RestError(errno.EUNAVAIL);

	if(job.hireRequests === undefined)
		job.hireRequests = [];

	if (applicant.hireRequests === undefined)
		applicant.hireRequests = [];

	job.hireRequests.push(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));
	applicant.hireRequests.push(factory.newRelationship("network.krow.assets", "Job", job.jobID));

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "RequestHireApplicantEvent");
	event.employer = job.employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.UnrequestHireApplicant} tx - unrequestHire to be processed
 * @transaction
 */
async function UnrequestHireApplicant(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

	if(job.employer.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if(!jobAvailable(job))
		throw new RestError(errno.EUNAVAIL);

	if(job.hireRequests === undefined || job.hireRequests.length == 0)
		throw new RestError(errno.ENOLIST);

	var removed = false;

	for (var i = 0; i < job.hireRequests.length; i++)
	{
		if(job.hireRequests[i].applicantID == applicant.applicantID)
		{
			job.hireRequests.splice(i, 1);
			removed = true;
			break;
		}
	}

	if(!removed)
		throw new RestError(errno.ENOLIST);

	for (var i = 0; i < applicant.hireRequests.length; i++)
	{
		if(applicant.hireRequests[i].jobID == job.jobID)
		{
			applicant.hireRequests.splice(i, 1);
			break;
		}
	}

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "RequestHireApplicantEvent");
	event.employer = job.employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.DenyApplicant} tx - denyApplicant to be processed
 * @transaction
 */
async function DenyApplicant(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;
	var reason = tx.reason;

	if(job.employer.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if(job.applicantRequests === undefined)
		throw new RestError(errno.ENOLIST);

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
		throw new RestError(errno.ENOLIST);

	if(job.deniedApplicants === undefined)
		job.deniedApplicants = [];

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

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "DenyApplicantEvent");
	event.employer = job.employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.FireApplicant} tx - fireApplicant to be processed
 * @transaction
 */
async function FireApplicant(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

	if(job.employer.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if((job.flags & JOB_ACTIVE) != JOB_ACTIVE)
		throw new RestError(errno.EACTIVE);

	if(job.employee.applicantID != applicant.applicantID || employer.inprogressJobs === undefined || applicant.inprogressJobs === undefined)
		throw new RestError(errno.ENOLIST);

	if(employer.terminatedJobs === undefined)
		employer.terminatedJobs = [];
	if(applicant.terminatedJobs === undefined)
		applicant.terminatedJobs = [];

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

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "FireApplicantEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.CompleteJob} tx - job to be completed
 * @transaction
 */
async function CompleteJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var job = tx.job;

	var applicant = job.employee;

	if(job.employer.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if((job.flags & JOB_REQUESTCOMPLETE) != JOB_REQUESTCOMPLETE)
		throw new RestError(errno.EINVAL, "Not requested for completion");

	if(employer.inprogressJobs === undefined || applicant.inprogressJobs === undefined)
		throw new RestError(errno.ENOLIST);

	if(employer.completedJobs === undefined)
		employer.completedJobs = [];
	if(applicant.completedJobs === undefined)
		applicant.completedJobs = [];

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

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "CompleteJobEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.DenyRequestCompleteJob} tx - job to be denied completed
 * @transaction
 */
async function DenyRequestCompleteJob(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var job = tx.job;

	if(employer.employerID != job.employer.employerID)
		throw new RestError(errno.ERELATE);

	if((job.flags & JOB_ACTIVE) != JOB_ACTIVE || (job.flags & JOB_REQUESTCOMPLETE) != JOB_REQUESTCOMPLETE)
		throw new RestError(errno.ENOACTIVE);

	job.flags &= ~JOB_REQUESTCOMPLETE;
	job.requestCompletedDate = undefined;

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	var event = factory.newEvent("network.krow.transactions.employer", "DenyRequestCompleteJobEvent");
	event.employer = job.employer;
	event.applicant = job.employee;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.EndorseSkill} tx - skill to endorse
 * @transaction
 */
async function EndorseSkill(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var skill = tx.skill;

	var isPrevEmployee = false;

	if(employer.completedJobs !== undefined)
	{
		for (var i = 0; i < employer.completedJobs.length; i++)
		{
			if(employer.completedJobs[i].employee.applicantID == applicant.applicantID)
			{
				isPrevEmployee = true;
				break;
			}
		}
	}

	if(!isPrevEmployee)
		throw new RestError(errno.ERELATE);

	var hasSkill = false;

	if(applicant.resume.skills !== undefined)
	{
		for (var i = 0; i < applicant.resume.skills.length; i++)
		{
			var sk = applicant.resume.skills[i];
			if(sk.skill == skill.skill)
			{
				var employerRelationship = factory.newRelationship("network.krow.participants", "Employer", employer.employerID);

				if(sk.endorsedBy === undefined)
				{
					sk.endorsedBy = [employerRelationship];
				}else
				{
					for (var j = 0; j < sk.endorsedBy.length; j++)
					{
						if(sk.endorsedBy[j].employerID == employer.employerID)
							throw new RestError(errno.EALREADY);
					}

					sk.endorsedBy.push(employerRelationship);
				}

				hasSkill = true;
				break;
			}
		}
	}

	if(!hasSkill)
		throw new RestError(errno.ENOLIST);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "SkillEndorsedEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.skill = skill;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.UnendorseSkill} tx - skill to unendorse
 * @transaction
 */
async function UnendorseSkill(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var skill = tx.skill;

	var hasSkill = false;
	var listed = false;

	if(applicant.resume.skills !== undefined)
	{
		for (var i = 0; i < applicant.resume.skills.length; i++)
		{
			var sk = applicant.resume.skills[i];
			if(sk.skill == skill.skill)
			{
				if(sk.endorsedBy === undefined)
					throw new RestError(errno.ENOLIST);

				for (var j = 0; j < sk.endorsedBy.length; j++)
				{
					if(sk.endorsedBy[j].employerID == employer.employerID)
					{
						sk.endorsedBy.splice(j, 1);
						listed = true;
						break;
					}
				}

				if(!listed)
					throw new RestError(errno.ENOLIST);

				hasSkill = true;
				break;
			}
		}
	}

	if(!hasSkill)
		throw new RestError(errno.ENOLIST);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "SkillUnendorsedEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.skill = skill;
	emit(event);
}

function validateModifyJob(job)
{
	if(!NAME_REGEX.test(job.title))
		throw new RestError(errno.EINVAL, "Invalid title: " + job.title);
	job.title = job.title.trim();

	job.description = job.description.trim();

	if(job.tags.length > MAX_TAGS)
		throw new RestError(errno.ELIMIT, "Too many tags (max " + MAX_TAGS + ")");

	var tagmap = {};

	for (var i = 0; i < job.tags.length; i++)
	{
		var tag = job.tags[i];

		if(!NAME_REGEX.test(tag))
			throw new RestError(errno.EINVAL, "Invalid tag: " + tag);

		//remove duplicates
		if(tagmap[tag] === true)
		{
			job.tags.splice(i--, 1);
			continue;
		}

		job.tags[i] = tag.trim();
		tagmap[tag] = true;
	}

	if(job.payment < 0)
		throw new RestError(errno.EINVAL, "Invalid payment");

	return true;
}
