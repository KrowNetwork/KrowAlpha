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
    var factory = getFactory(); // get factory to emit events and create relationships
    var employer = requestJob.employer;
    var applicant = requestJob.applicant;
    var job = requestJob.job;

    if (job.hasApplicants == false) {
      job.applicantRequests = new Array();
      job.hasApplicants == true;
    }

    var applicantRef = factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID);
    job.applicantRequests.push(applicantRef);

    var event = factory.newEvent("network.krow.transactions.applicant", "RequestJobEvent");
    event.employer = employer;
    event.applicant = applicant;
    event.job = job;
    emit(event);

    return getAssetRegistry('network.krow.assets.Job')
    		.then(function (assetRegistry) {
      		return assetRegistry.update(job);

    })
  }

/**
 * @param {network.krow.transactions.applicant.UnrequestJob} unrequestJob - unrequestJob to be processed
 * @transaction
 */
 function UnrequestJob(unrequestJob) {
   var factory = getFactory(); // get factory to emit events and create relationships
   var employer = requestJob.employer;
   var applicant = requestJob.applicant;
   var job = requestJob.job;

   if (job.hasApplicants == false) {
     return;
   }

   for (int i = 0; i < job.applicantRequests.length; i ++) {
     if (job.applicantRequests[i].applicantID === applicant.applicantID) {
       job.applicantRequests.splice(i, 1);
     }
   }


   if (job.applicantRequests.length == 0) {
     job.hasApplicants = false;
   }

   var event = factory.newEvent("network.krow.transactions.applicant", "UnrequestJobEvent");
   event.employer = employer;
   event.applicant = applicant;
   event.job = job;
   emit(event);

   return getAssetRegistry('network.krow.assets.Job')
       .then(function (assetRegistry) {
         return assetRegistry.update(job);

   })
 }
