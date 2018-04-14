"use strict";

/**
 * @param {network.krow.transactions.delete.DeleteApplicant} tx - applicant to be deleted
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

	//var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	//await applicantRegistry.delete(applicant);

	var event = factory.newEvent("network.krow.transactions.delete", "ApplicantDeleted");
	event.applicant = applicant;
	emit(event);
}
