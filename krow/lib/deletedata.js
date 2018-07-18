"use strict";

/**
 * @param {network.krow.transactions.deletedata.DeleteApplicant} tx
 * @transaction
 */
async function DeleteApplicant(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;

	if(applicant.inprogressJobs !== undefined)
	{
		while(applicant.inprogressJobs.length > 0)
		{
			//removes from inprogressJobs
			await ResignJob({
				"applicant": applicant,
				"job": applicant.inprogressJobs[0]
			});
		}
	}

	if(applicant.requestedJobs !== undefined)
	{
		while(applicant.requestedJobs.length > 0)
		{
			//removes from requestedJobs
			await UnrequestJob({
				"applicant": applicant,
				"job": applicant.requestedJobs[0]
			});
		}
	}

	if(applicant.hireRequests !== undefined)
	{
		while(applicant.hireRequests.length > 0)
		{
			//removes from hireRequests
			await UnrequestHireApplicant({
				"employer": applicant.hireRequests[0].employer,
				"applicant": applicant,
				"job": applicant.hireRequests[0]
			});
		}
	}

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.delete(applicant);

	var event = factory.newEvent("network.krow.transactions.deletedata", "ApplicantDeleted");
	event.applicant = applicant;
	emit(event);
}

/**
 * @param {network.krow.transactions.deletedata.DeleteEmployer} tx
 * @transaction
 */
async function DeleteEmployer(tx)
{
	var factory = getFactory();
	var employer = tx.employer;

	if(employer.inprogressJobs !== undefined)
	{
		while(employer.inprogressJobs.length > 0)
		{
			//removes from inprogressJobs
			await RemoveJob({
				"applicant": applicant,
				"job": applicant.inprogressJobs[0]
			});
		}
	}

	if(employer.availableJobs !== undefined)
	{
		while(employer.availableJobs.length > 0)
		{
			//removes from availableJobs
			await RemoveJob({
				"applicant": applicant,
				"job": applicant.availableJobs[0]
			});
		}
	}

	var employerRegistry = await getParticipantRegistry('network.krow.participants.Employer');
	await employerRegistry.delete(employer);

	var event = factory.newEvent("network.krow.transactions.deletedata", "EmployerDeleted");
	event.employer = employer;
	emit(event);
}

/**
 * @param {network.krow.transactions.deletedata.DeleteJob} tx
 * @transaction
 */
async function DeleteJob(tx)
{
	var factory = getFactory();
	var job = tx.job;

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
		}
	}

	if(job.hireRequests !== undefined)
	{
		for (var i = 0; i < job.hireRequests.length; i++)
		{
			var appl = job.hireRequests[i];
			for (var j = 0; j < appl.hireRequests.length; j++)
			{
				if(appl.hireRequests[j].jobID == job.jobID)
				{
					appl.hireRequests.splice(j, 1);
					break;
				}
			}
		}
	}

	if(job.employee !== undefined)
	{
		await FireApplicant({
			"employer": job.employer,
			"applicant": job.employee,
			"job": job,
			"reason": "Job was deleted"
		});
	}

	job.flags = 16

	var employerRegistry = await getParticipantRegistry("network.krow.participants.Employer")
	var employer = await employerRegistry.get(job.employerID)
	// throw new Error(employer.employerID)

	if (employer.terminatedJobs === undefined) {
		employer.terminatedJobs = []
	}

	employer.terminatedJobs.push(job)
	for (var i = 0; i < employer.availableJobs.length; i++) {
		if (employer.availableJobs[i].jobID == job.jobID) {
			employer.availableJobs.splice(i, 1);
			break
		}
	}

	var jobRegistry = await getAssetRegistry('network.krow.assets.Job');
	await jobRegistry.update(job);

	await employerRegistry.update(employer)

	var event = factory.newEvent("network.krow.transactions.deletedata", "JobDeleted");
	event.job = job;
	emit(event);
}
