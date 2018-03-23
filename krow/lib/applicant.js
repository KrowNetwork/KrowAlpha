var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_CANCELLED = 8;

var DENIED_EXPIRE = 7 * 24 * 60 * 60 * 1000; //7 days

/**
 * @param {network.krow.transactions.applicant.UpdateResume} updateResume - updateResume to be processed
 * @transaction
 */
function UpdateResume(updateResume)
{
	var factory = getFactory(); // get factory to emit events
	var applicant = updateResume.applicant;
	var resume = updateResume.resume;
	applicant.resume = resume;

	return getParticipantRegistry('network.krow.participants.Applicant')
		.then(function (participantRegistry){
			return participantRegistry.update(applicant);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "ResumeChangedEvent");
			event.applicant = applicant;
			event.resume = resume;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.RequestJob} requestJob - requestJob to be processed
 * @transaction
 */
function RequestJob(requestJob)
{
	var factory = getFactory(); // get factory to emit events and create relationships
	var employer = requestJob.employer;
	var applicant = requestJob.applicant;
	var job = requestJob.job;

	if(!jobAvailable(job))
		throw new Error("Unavailable");

	//check if applicant is currently denied a request
	if(job.deniedApplicants !== undefined && job.deniedApplicants.length > 0)
	{
		var removed = updateDeniedApplicants(job);
		if(removed > 0)
		{
			getAssetRegistry('network.krow.assets.Job')
				.then(function (assetRegistry){
					return assetRegistry.update(job);
				});
		}

		for (var i = 0; i < job.deniedApplicants.length; i++)
		{
			var denied = job.deniedApplicants[i];
			if(denied.applicantID == applicant.applicantID)
				throw new Error("Denied: " + JSON.stringify(denied));
		}
	}

	if(job.applicantRequests === undefined)
		job.applicantRequests = new Array();

	if(applicant.requestedJobs === undefined)
		applicant.requestedJobs = new Array();

	var applicantRef = factory.newRelationship("network.krow.participants", "Applicant", applicant.applicantID);
	job.applicantRequests.push(applicantRef);

	var jobRef = factory.newRelationship("network.krow.assets", "Job", job.jobID);
	applicant.requestedJobs.push(jobRef);

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
			var event = factory.newEvent("network.krow.transactions.applicant", "RequestJobEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

/**
 * @param {network.krow.transactions.applicant.UnrequestJob} unrequestJob - unrequestJob to be processed
 * @transaction
 */
function UnrequestJob(unrequestJob)
{
	var factory = getFactory(); // get factory to emit events and create relationships
	var employer = unrequestJob.employer;
	var applicant = unrequestJob.applicant;
	var job = unrequestJob.job;

	if(job.deniedApplicants !== undefined && job.deniedApplicants.length > 0)
	{
		var removed = updateDeniedApplicants(job);
		if(removed > 0)
		{
			getAssetRegistry('network.krow.assets.Job')
				.then(function (assetRegistry){
					return assetRegistry.update(job);
				});
		}
	}

	if(job.applicantRequests === undefined || !job.applicantRequests.length)
		throw new Error("Not Listed: " + JSON.stringify(denied));

	var removed = false;

	for (var i = 0; i < job.applicantRequests.length; i++)
	{
		if(job.applicantRequests[i].applicantID == applicant.applicantID)
		{
			job.applicantRequests.splice(i--, 1);
			removed = true;
			break;
		}
	}

	if(!removed)
		throw new Error("Not Listed: " + JSON.stringify(denied));

	return getAssetRegistry('network.krow.assets.Job')
		.then(function (assetRegistry) {
			return assetRegistry.update(job);
		})
		.then(function (){
			var event = factory.newEvent("network.krow.transactions.applicant", "UnrequestJobEvent");
			event.employer = employer;
			event.applicant = applicant;
			event.job = job;
			emit(event);
		});
}

function updateDeniedApplicants(job)
{
	var denied = job.deniedApplicants;
	var removed = 0;

	for (var i = 0; i < denied.length; i++)
	{
		if(new Date() - denied[i].deniedDate >= DENIED_EXPIRE)
		{
			denied.splice(i--, 1);
			removed++;
		}
	}

	return removed;
}

function jobAvailable(job)
{
	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE || (job.flags & JOB_COMPLETE) == JOB_COMPLETE || (job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		return false;
	return (job.flags & JOB_OPEN) == JOB_OPEN;
}
