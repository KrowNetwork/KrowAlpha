/**
 * @param {network.krow.transactions.employer.NewJob} newJob - NewJob to be processed
 * @transaction
 */
function NewJob(newJob)
{
	var factory = getFactory();
	var employer = newJob.employer;
	var job = newJob.job;

	if(employer.availableJobs === undefined)
		employer.availableJobs = new Array();

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	employer.availableJobs.push(jobRef);

	return getParticipantRegistry('network.krow.participants.Employer')
		.then(function(participantRegistry){
			return participantRegistry.update(employer);
		})
		.then(function(){
			var event = factory.newEvent("network.krow.transactions.employer", "NewJobEvent");
			event.employer = employer;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.RemoveJob} removeJob - RemoveJob to be processed
 * @transaction
 */
function RemoveJob(removeJob)
{
	var factory = getFactory();
	var employer = removeJob.employer;
	var job = removeJob.job;

	removeAvaliableJob(employer, job);

	return getParticipantRegistry('network.krow.participants.Employer')
		.then(function(participantRegistry){
			return participantRegistry.update(employer);
		})
		.then(function(participantRegistry){
			if(job.applicantRequests.length != 0)
			{
				for (var i = 0; i < job.applicantRequests.length; i++)
				{
					removeJobFromRequested(job.applicantRequests[i], job);
				}
			}

			return participantRegistry.update(req);
		})
		.then(function(){
			var event = factory.newEvent("network.krow.transactions.employer", "JobRemovedEvent");
			event.employer = employer;
			event.job = job;
			emit(event);
		});
}


/**
 * @param {network.krow.transactions.employer.HireApplicant} hireApplicant - hireApplicant to be processed
 * @transaction
 */
function HireApplicant(hireApplicant)
{
	var factory = getFactory();
	var employer = hireApplicant.employer;
	var applicant = hireApplicant.applicant;
	var job = hireApplicant.job;

	if(employer.inprogressJobs === undefined)
		employer.inprogressJobs = new Array();

	if(applicant.inprogressJobs === undefined)
		applicant.inprogressJobs = new Array();

	removeAvaliableJob(employer, job);
	job.employee = factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID);

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID)
	employer.inprogressJobs.push(jobRef);
	applicant.inprogressJobs.push(jobRef);

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry) {
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					participantRegistry.update(applicant);
				})
				.then(function (participantRegistry){
					if(job.applicantRequests.length != 0)
					{
						for (var i = 0; i < job.applicantRequests.length; i ++)
						{
							removeJobFromRequested(job.applicantRequests[i], job);
							participantRegistry.update(job.applicantRequests[i]);
						}
					}
				})
				.then(function (){
					return getParticipantRegistry('network.krow.participants.Employer')
						.then(function (participantRegistry){
							participantRegistry.update(employer);
						});
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "HireApplicantEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.DenyApplicant} denyApplicant - denyApplicant to be processed
 * @transaction
 */
function DenyApplicant(denyApplicant)
{
	var factory = getFactory();
	var employer = denyApplicant.employer;
	var applicant = denyApplicant.applicant;
	var job = denyApplicant.job;

	if(job.deniedApplicants === undefined)
		job.deniedApplicants = new Array();

	job.deniedApplicants.push(factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID));
	removeJobFromRequested(applicant, job);

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					participantRegistry.update(applicant);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "DenyApplicantEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.FireApplicant} fireApplicant - fireApplicant to be processed
 * @transaction
 */
function FireApplicant(fireApplicant)
{
	var factory = getFactory();
	var employer = fireApplicant.employer;
	var applicant = fireApplicant.applicant;
	var job = fireApplicant.job;

	job.employee = null;
	removeInprogressJob(applicant, job);

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			return getParticipantRegistry('network.krow.participants.Applicant')
				.then(function (participantRegistry){
					participantRegistry.update(applicant);
				});
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "FireApplicantEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.RateJob} RateJob - rateJob to be processed
 * @transaction
 */
function RateJob(rateJob)
{
	var factory = getFactory();
	var employer = rateJob.employer;
	var applicant = rateJob.applicant;
	var job = rateJob.job;
	var rating = rateJob.rating;

	rating.hasEmployerConfirmation = true; // set to true because the employer is the one sending in the transaction

	if (rating.hasApplicantConfirmation == false)
		throw new Error("Rating does not have applicant confirmation");

	job.rating = rating;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.employer", "JobRated");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.employer.UnrateJob} unrateJob - unrateJob to be processed
 * @transaction
 */
function UnrateJob(unrateJob)
{
	var factory = getFactory();
	var employer = unrateJob.employer;
	var applicant = unrateJob.applicant;
	var job = unrateJob.job;
	var rating = job.rating;

	rating.hasEmployerConfirmationForRemoval = true; // set to true because the employer is the one sending in the transaction

	if(unrateJob.hasApplicantConfirmationForRemoval == false)
		throw new Error("Rating does not have applicant confirmation for removal");

	job.rating = rating;

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry){
			return assetRegistry.update(job);
		})
		.then(function () {
			var event = factory.newEvent("network.krow.transactions.employer", "JobUnrated");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

function removeAvaliableJob(employer, job)
{
	for (var i = 0; i < employer.availableJobs.length; i++)
	{
		if(employer.availableJobs[i].jobID == job.jobID)
		{
			employer.availableJobs.split(i, 1);
			break;
		}
	}
}

function removeJobFromRequested(applicant, job)
{
	for (var i = 0; i < applicant.requestedJobs.length; i++)
	{
		if(applicant.requestedJobs[i].jobID == job.jobID)
		{
			applicant.requestedJobs.split(i, 1);
			break;
		}
	}
}

function removeInprogressJob(participant, job)
{
	for (var i = 0; i < participant.inprogressJobs.length; i++)
	{
		if(participant.inprogressJobs[i].jobID == job.jobID)
		{
			participant.inprogressJobs.split(i, 1);
			break;
		}
	}
}