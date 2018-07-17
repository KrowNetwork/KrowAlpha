"use strict";

var MAX_DESCRIPTION = 16384;
var MAX_AVAILABLEJOBS = 1000;//100;
var MAX_TAGS = 20;

/**
 * @param {network.krow.transactions.employer.UpdateEmployer} tx
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

	if(employer.employerName.length > MAX_NAMELENGTH)
		throw new RestLimitError("Employer name", MAX_NAMELENGTH);
	if(!NAME_REGEX.test(employer.employerName))
		throw new RestInvalidError("employer name", employer.employerName);
	employer.employerName = employer.employerName.trim();

	if(employer.description.length > MAX_DESCRIPTION)
		throw new RestLimitError("Description", MAX_DESCRIPTION);
	employer.description = employer.description.trim();

	employer.lastUpdated = new Date();

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var event = factory.newEvent("network.krow.transactions.employer", "EmployerChangedEvent");
	event.employer = employer;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.NewJob} tx
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
		"paymentType",
		"jobType"
	];

	for (var i = 0, len = copyfield.length; i < len; i++)
	{
		var c = copyfield[i];
		if(newJob[c] === undefined)
		{
			var missing = [c];
			for (; i < len; i++)
			{
				c = copyfield[i];
				if(newJob[c] === undefined)
					missing.push(c);
			}
			throw new RestError(errno.EINVAL, "Missing required fields: " + c.join(", "));
		}
	}

	if(employer.availableJobs !== undefined && employer.availableJobs.length > MAX_AVAILABLEJOBS)
		throw new RestLimitError("Available jobs", MAX_AVAILABLEJOBS);

	//thrown, not returned
	validateModifyJob(newJob);

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');

	var id = uuidv4();

	var job = factory.newResource("network.krow.assets", "Job", id);

	for (var i = 0, len = copyfield.length; i < len; i++)
	{
		var c = copyfield[i];
		job[c] = newJob[c];
	}

	// job.employer = factory.newRelationship("network.krow.participants", "Employer", employer.employerID);
	job.employerID = employer.employerID;
	job.created = new Date();
	job.flags = JOB_OPEN;

	if(employer.availableJobs === undefined)
		employer.availableJobs = [];

	await jobRegistry.add(job);


	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	employer.availableJobs.push(jobRef);


	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.update(employer);

	var event = factory.newEvent("network.krow.transactions.employer", "NewJobEvent");
	event.employer = employer;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.UpdateJob} tx
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
		"location",
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
 * @param {network.krow.transactions.employer.RemoveJob} tx
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
 * @param {network.krow.transactions.employer.RequestHireApplicant} tx
 * @transaction
 */
async function RequestHireApplicant(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var job = tx.job;

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	// var employerRegistry = await getAssetRegistry('network.krow.participants.Employer');
	var applicantRegistry = await getAssetRegistry('network.krow.participants.Applicant');
	

	if(job.employerID != employer.employerID)
		throw new RestError(errno.ERELATE);

	if(!jobAvailable(job))
		throw new RestError(errno.EUNAVAIL);

	if(job.hireRequests === undefined)
		job.hireRequests = [];

	if (applicant.hireRequests === undefined)
		applicant.hireRequests = [];

	job.hireRequests.push(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));
	applicant.hireRequests.push(factory.newRelationship("network.krow.assets", "Job", job.jobID));
	
	await jobRegistry.update(job);

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.update(applicant);

	var event = factory.newEvent("network.krow.transactions.employer", "RequestHireApplicantEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.UnrequestHireApplicant} tx
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

	var event = factory.newEvent("network.krow.transactions.employer", "UnrequestHireApplicantEvent");
	event.employer = job.employer;
	event.applicant = applicant;
	event.job = job;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.DenyApplicant} tx
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
 * @param {network.krow.transactions.employer.FireApplicant} tx
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
 * @param {network.krow.transactions.employer.CompleteJob} tx
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
 * @param {network.krow.transactions.employer.DenyRequestCompleteJob} tx
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
 * @param {network.krow.transactions.employer.EndorseSkill} tx
 * @transaction
 */
async function EndorseSkill(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var skillName = tx.skillName;

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
			if(sk.skill == skillName)
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

	var event = factory.newEvent("network.krow.transactions.employer", "EndorseSkillEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.skillName = skillName;
	emit(event);
}

/**
 * @param {network.krow.transactions.employer.UnendorseSkill} tx
 * @transaction
 */
async function UnendorseSkill(tx)
{
	var factory = getFactory();
	var employer = tx.employer;
	var applicant = tx.applicant;
	var skillName = tx.skillName;

	var hasSkill = false;
	var listed = false;

	if(applicant.resume.skills !== undefined)
	{
		for (var i = 0; i < applicant.resume.skills.length; i++)
		{
			var sk = applicant.resume.skills[i];
			if(sk.skill == skillName)
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

	var event = factory.newEvent("network.krow.transactions.employer", "UnendorseSkillEvent");
	event.employer = employer;
	event.applicant = applicant;
	event.skillName = skillName;
	emit(event);
}

function validateModifyJob(job)
{
	if(job.title > MAX_NAMELENGTH)
		throw new RestLimitError("Title", MAX_NAMELENGTH);
	//if(!NAME_REGEX.test(job.title))
	//	throw new RestInvalidError("title", job.title);
	job.title = job.title.trim();

	if(job.description > MAX_DESCRIPTION)
		throw new RestLimitError("Description", MAX_DESCRIPTION);
	job.description = job.description.trim();

	if(job.location > MAX_NAMELENGTH)
		throw new RestLimitError("Location", MAX_NAMELENGTH);

	if(job.tags.length > MAX_TAGS)
		throw new RestLimitError("Tags", MAX_TAGS);

	var tagmap = {};

	for (var i = 0; i < job.tags.length; i++)
	{
		var tag = job.tags[i];

		if(tag.length > MAX_NAMELENGTH)
			throw new RestLimitError("Tag", MAX_NAMELENGTH);
		//if(!NAME_REGEX.test(tag))
		//	throw new RestInvalidError("tag", tag);

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
		throw new RestInvalidError("payment");

	return true;
}
