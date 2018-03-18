/** HELPER FUNCTIONS **/
function removeAvaliableJob(employer, job) {
  for (var i = 0; i < employer.availableJobs.length; i ++) {
    if (employer.availableJobs[i].jobID == job.jobID) {
      employer.availableJobs.split(i, 1);
    }
  }
  return employer
}

function createInprogressList(participant) {
  participant.inprogressJobs = new Array();
  participant.hasInprogressJobs = true;
  return participant
}

/** END OF HELPER FUNCTIONS **/
