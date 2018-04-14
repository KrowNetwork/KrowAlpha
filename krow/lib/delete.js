"use strict";

/**
 * @param {network.krow.transactions.delete.DeleteApplicant} tx - applicant to be deleted
 * @transaction
 */
async function DeleteApplicant(tx)
{
	var factory = getFactory();
	var applicant = tx.applicant;

	var applicantRegistry = await getParticipantRegistry('network.krow.participants.Applicant');
	await applicantRegistry.delete(applicant);

	var event = factory.newEvent("network.krow.transactions.delete", "ApplicantDeleted");
	event.applicant = applicant;
	emit(event);
}
