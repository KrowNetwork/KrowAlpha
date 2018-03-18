// HELPER FUNCTIONS
function removeAvaliableJob(employer, job) {
  for (var i = 0; i < employer.availableJobs.length; i ++) {
    if (employer.availableJobs[i].jobID == job.jobID) {
      employer.availableJobs.split(i, 1);
    }
  }
  return employer
}

function removeJobFromRequested(applicant, job) {
  for (var i = 0; i < applicant.requestedJobs.length; i ++) {
    if (applicant.requestedJobs[i].jobID == job.jobID) {
      applicant.requestedJobs.split(i, 1);
    }
  }
  return applicant
}

function createInprogressList(participant) {
  participant.inprogressJobs = new Array();
  participant.hasInprogressJobs = true;
  return participant
}

function createDeniedApplicantList(job) {
  job.deniedApplicants = new Array();
  job.hasDeniedApplicants = true;
  return job
}

// END HELPER FUNCTIONS

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


  employer = removeAvaliableJob(employer, job);


  return getParticipantRegistry('network.krow.participants.Employer')
  		.then(function (participantRegistry) {
    		return participantRegistry.update(employer);

  })
      .then(function (participantRegistry){
      if (job.applicantRequests.length != 0) {
        for each (var req in job.applicantRequests) {
          req = removeJobFromRequested(req, job);
        }
      }
      return participantRegistry.update(req);
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
     applicant = createInprogressList(applicant);
   }

   employer = removeAvaliableJob(employer, job);
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
       .then(function (participantRegistry){
       if (job.applicantRequests.length != 0) {
         for each (var req in job.applicantRequests) {
           req = removeJobFromRequested(req, job);
         }
       }
       return participantRegistry.update(req);
    })
        .then(function () {
          var event = factory.newEvent("network.krow.transactions.employer", "HireApplicantEvent");
          event.employer = employer;
          event.applicant = applicant;
          event.job = job;
          emit(event);
   })
}

/**
* @param {network.krow.transactions.employer.DenyApplicant} denyApplicant - denyApplicant to be processed
* @transaction
*/
 function DenyApplicant(denyApplicant) {
   var factory = getFactory(); // get factory to emit events and create relationships
   var employer = denyApplicant.employer;
   var applicant = denyApplicant.applicant;
   var job = denyApplicant.job;

   if (job.hasDeniedApplicants == false) {
     job = createDeniedApplicantList(job);
   }

   job.deniedApplicants.push(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));
   applicant = removeJobFromRequested(applicant, job);


   return getAssetRegistry('network.krow.assets.Job')
       .then(function (assetRegistry) {
         return assetRegistry.update(job);
   })
       .then(function (participantRegistry) {
         return assetRegistry.update(applicant);
   })
        .then(function () {
          var event = factory.newEvent("network.krow.transactions.employer", "DenyApplicantEvent");
          event.employer = employer;
          event.applicant = applicant;
          event.job = job;
          emit(event);
   })
}
