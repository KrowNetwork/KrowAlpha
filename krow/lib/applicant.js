/**
 * @param {network.krow.transactions.applicant.UpdateResume} updateResume - updateResume to be processed
 * @transaction
 */
 function UpdateResume(updateResume) {
   var factory = getFactory(); // get factory to emit events
   var applicant = updateResume.applicant;
   var resume = updateResume.resume;
   applicant.resume = resume;

   var event = factory.newEvent("network.krow.transactions.applicant", "ResumeChangedEvent");
   event.applicant = applicant;
   event.resume = resume;
   emit(event);

   return getParticipantRegistry('network.krow.participants.Applicant')
   		.then(function (participantRegistry) {
     		return participantRegistry.update(applicant);

   })
 }


 /**
  * @param {network.krow.transactions.applicant.RequestJob} requestJob - requestJob to be processed
  * @transaction
  */
  function RequestJob(requestJob) {
    var factory = getFactory(); // get factory to emit events
    var employer = requestJob.employer;
    var applicant = requestJob.applicant;
    var job = requestJob.job;

    if (jpb.hasApplicants == false) {
      job.applicantRequests = new Array();
      job.hasApplicants == true;
    }

    var applicantRef = factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID);
    job.applicantRequests.push(applicantRef);

    var event = factory.newEvent("network.krow.transactions.applicant", "ResumeChangedEvent");
    event.applicant = applicant;
    event.resume = resume;
    emit(event);

    return getAssetRegistry('network.krow.assets.Job')
    		.then(function (assetRegistry) {
      		return assetRegistry.update(job);

    })
  }
