/**
 * New script file
 */
/**
 * @param {org.krow.transactions.Hire} hire - hiring to be processed
 * @transaction
 */
function hireWorker(hire) {
  var factory = getFactory();
  var jobs = new Array();


  // check if resume has jobs and if not add array
  if (hire.user.resume.hasJobs == false) {
    hire.user.resume.jobs = new Array();
    hire.user.resume.hasJobs = true;
  }
  // span through array, create new references for jobs
  for (var i = 0; i < hire.user.resume.jobs.length; i ++) {
    var j = factory.newRelationship("org.krow.assets", "Job", hire.user.resume.jobs[i].jobID);
    jobs.push(j)
  }

  // create reference to new job
  var j = factory.newRelationship("org.krow.assets", "Job", hire.job.jobID);
  jobs.push(j)

  /// set jobs in reusme
  hire.user.resume.jobs = jobs;
  // set user in job
  hire.job.user = hire.user;

  // send event
  var event = factory.newEvent("org.krow.assets", "HireEvent");
  event.employee = hire.user;
  event.company = hire.job.comp;
  emit(event);

  // update the job
  updateJob(hire.job);

  // update the resume
  return getAssetRegistry('org.krow.assets.Resume')
  		.then(function (assetRegistry) {
    		return assetRegistry.update(hire.user.resume);

  })

}

function updateJob(job) {
  // update job
  return getAssetRegistry('org.krow.assets.Job')
        .then(function (assetRegistry) {
            return assetRegistry.update(job);

  })
}

/**
 * @param {org.krow.transactions.AddResume} addResume - addResume to be processed
 * @transaction
 */
function addResume(addResume) {
  // adds resume in the transaction to the user
  addResume.user.resume = addResume.resume;
  return getParticipantRegistry('org.krow.participants.User')
        .then(function (participantRegistry) {

            // Update the asset in the asset registry.
            return participantRegistry.update(addResume.user);

        })
}



/**
 * @param {org.krow.transactions.Rate} rate - rate to be processed
 * @transaction
 */
function Rate(rate) {

  var factory = getFactory();
  var rates = new Array()
  // check if resume has ratings
  if (rate.job.user.resume.hasRatings == false) {
    rate.job.user.resume.ratings = new Array();
    rate.job.user.resume.hasRatings = true;
  }
  // run through each rate reference and create a new reference, add to array
  for (var i = 0; i < rate.job.user.resume.ratings.length; i ++) {
      var r = factory.newRelationship("org.krow.assets", "Rating", rate.job.user.resume.ratings[i].ratingID);
      rates.push(r)
    }

  // create reference to new rate
  var r = factory.newRelationship("org.krow.assets", "Rating", rate.rating.ratingID);
  rates.push(r)

  // connect new rates array to resume
  rate.job.user.resume.ratings = rates;

  return getAssetRegistry('org.krow.assets.Resume')
        .then(function (assetRegistry) {

            // Update the asset in the asset registry.
            return assetRegistry.update(rate.job.user.resume);

        })
}

/**
 * @param {org.krow.remove.DeleteUser} deleteUser - deleteUser to be processed
 * @transaction
 */
function DeleteUser(deleteUser) {
  var factory = getFactory()
  return getParticipantRegistry('org.krow.participants.User')
        .then(function (participantRegistry) {

            // Update the asset in the asset registry.
            return participantRegistry.remove(deleteUser.user);

        })
}
