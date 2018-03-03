/**
 * New script file
 */
/**
 * @param {org.krow.model.Hire} hire - hiring to be processed
 * @transaction
 */
function hireWorker(hire) {
  // hire.job.user = hire.user;
  var factory = getFactory();
  var jobs = new Array()
  if (hire.user.resume.hasJobs == false) {
    hire.user.resume.jobs = new Array();
    hire.user.resume.hasJobs = true;
  }

  for (var i = 0; i < hire.user.resume.jobs.length; i ++) {
    var j = factory.newRelationship("org.krow.model", "Job", hire.user.resume.jobs[i].jobID);
    jobs.push(j)
  }
  var j = factory.newRelationship("org.krow.model", "Job", job.jobID);
  jobs.push(j)

  hire.user.resume.jobs = jobs;


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

/**
 * @param {org.krow.model.AddEducation} addEducation - addEducation to be processed
 * @transaction
 */
function addEducation(addEducation) {


  var factory = getFactory();
  var eds = new Array()
  // check if resume has education
  if (addEducation.user.resume.hasEducation == false) {
    addEducation.user.resume.education = new Array();
    addEducation.user.resume.hasEducation = true;
  }
  // run through each education reference and create a new reference, add to array
  for (var i = 0; i < addEducation.user.resume.education.length; i ++) {
      var e = factory.newRelationship("org.krow.model", "Education", addEducation.user.resume.education[i].educationID);
      eds.push(e)
    }

  // create reference to new education
  var e = factory.newRelationship("org.krow.model", "Education", addEducation.education.educationID);
  eds.push(e)

  // connect new eds array to resume
  addEducation.user.resume.education = eds;

  return getAssetRegistry('org.krow.model.Resume')
        .then(function (assetRegistry) {

            // Update the asset in the asset registry.
            return assetRegistry.update(addEducation.user.resume);

        })
}


/**
 * @param {org.krow.model.Rate} rate - rate to be processed
 * @transaction
 */
function Rate(rate) {

  var factory = getFactory();
  var rates = new Array()
  // check if resume has ratings
  if (rate.user.resume.hasRatings == false) {
    rate.user.resume.ratings = new Array();
    rate.user.resume.hasRatings = true;
  }
  // run through each rate reference and create a new reference, add to array
  for (var i = 0; i < rate.user.resume.ratings.length; i ++) {
      var r = factory.newRelationship("org.krow.model", "Rating", rate.user.resume.ratings[i].rateID);
      rates.push(r)
    }

  // create reference to new rate
  var r = factory.newRelationship("org.krow.model", "Rating", rate.rating.rateID);
  rates.push(r)

  // connect new rates array to resume
  rate.user.resume.ratings = rates;

  return getAssetRegistry('org.krow.model.Resume')
        .then(function (assetRegistry) {

            // Update the asset in the asset registry.
            return assetRegistry.update(rate.user.resume);

        })
}
