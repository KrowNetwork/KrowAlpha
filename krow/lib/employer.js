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
