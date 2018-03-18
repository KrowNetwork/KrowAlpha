import * as helper from "helper.js"

/**
 * @param {network.krow.transactions.employer.NewJob} newJob - NewJob to be processed
 * @transaction
 */
 function NewJob(newJob) {
   var factory = getFactory(); // get factory to emit events
   var employer = newJob.employer;
   var job = newJob.job;

   if (employer.hasAvailableJobs == false) {
     employer.availableJobs = new Array();
     employer.hasAvailableJobs == true;
   }

   var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
   employer.availableJobs.push(jobRef);

   return getParticipantRegistry('network.krow.participants.Employer')
   		.then(function (participantRegistry) {
     		return participantRegistry.update(employer);

   })
      .then(function () {
        var event = factory.newEvent("network.krow.transactions.employer", "NewJobEvent");
        event.employer = employer;
        event.job = job;
        emit(event);
      })
 }

/**
* @param {network.krow.transactions.employer.RemoveJob} removeJob - RemoveJob to be processed
* @transaction
*/
function RemoveJob(removeJob) {
  var factory = getFactory(); // get factory to emit events
  var employer = removeJob.employer;
  var job = removeJob.job;

  employer = helper.removeAvaliableJob(employer, job);

  return getParticipantRegistry('network.krow.participants.Employer')
  		.then(function (participantRegistry) {
    		return participantRegistry.update(employer);

  })
     .then(function () {
       var event = factory.newEvent("network.krow.transactions.employer", "JobRemovedEvent");
       event.employer = employer;
       event.job = job;
       emit(event);
     })
}


/**
* @param {network.krow.transactions.employer.HireApplicant} hireApplicant - hireApplicant to be processed
* @transaction
*/
 function HireApplicant(hireApplicant) {
   var factory = getFactory(); // get factory to emit events and create relationships
   var employer = hireApplicant.employer;
   var applicant = hireApplicant.applicant;
   var job = hireApplicant.job;

   if (employer.hasInprogressJobs == false) {
     employer = helper.createInprogressList(employer);
   }

   if (applicant.hasInprogressJobs == false) {
     applicant = helper.createInprogressList(applicant);
   }

   employer = helper.removeAvaliableJob(employer, job);
   job.employee = factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID);

   var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID)
   employer.inprogressJobs.push(jobRef);
   applicant.inprogressJobs.push(jobRef);

   return getAssetRegistry('network.krow.assets.Job')
       .then(function (assetRegistry) {
         return assetRegistry.update(job);
   })
       .then(function (participantRegistry) {
         return assetRegistry.update(applicant);
   })
       .then(function (participantRegistry) {
         return assetRegistry.update(employer);
   })
        .then(function () {
          var event = factory.newEvent("network.krow.transactions.employer", "HireApplicantEvent");
          event.employer = employer;
          event.applicant = applicant;
          event.job = job;
          emit(event);
   })
}
