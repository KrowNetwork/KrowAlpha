/**
 * New script file
 */
/**
 * @param {org.krow.model.Hire} hire - hiring to be processed
 * @transaction
 */
function hireWorker(hire) {
  hire.job.user = hire.user;
  updateResumeJobList(hire.user, hire.job)
  return getAssetRegistry('org.krow.model.Job')
        .then(function (assetRegistry) {

            // Update the asset in the asset registry.
            return assetRegistry.update(hire.job);

        })
}
/**
 * @param {org.krow.model.User} user - user for job to be added to
 * @param {org.krow.model.Job} job - job to be added
 */
function updateResumeJobList(user, job)
{
  var jobs = new Array()
  jobs = user.resume.jobs;
  jobs.push(job);
  user.resume.jobs = jobs;

  return getAssetRegistry('org.krow.model.Resume')
  		.then(function (assetRegistry) {
    		return assetRegistry.update(user.resume);

  })

}

/**
 * @param {org.krow.model.AddResume} addResume - addResume to be processed
 * @transaction
 */
function addResume(addResume) {
  // adds resume in the transaction to the user
  addResume.user.resume = addResume.resume;
  return getParticipantRegistry('org.krow.model.User')
        .then(function (participantRegistry) {

            // Update the asset in the asset registry.
            return participantRegistry.update(addResume.user);

        })
}
