/**
 * @param {org.krow.transactions.applicant.UpdateResume} updateResume - updateResume to be processed
 * @transaction
 */
 function UpdateResume(updateResume) {
   var factory = getFactory(); // get factory to emit events
   var applicant = updateResume.applicant;
   var resume = updateResume.resume;
   applicant.resume = resume;

   var event = factory.newEvent("org.krow.transactions.applicant", "ResumeChangedEvent");
   event.applicant = applicant;
   event.resume = resume;
   emit(event);

   return getAssetRegistry('org.krow.participants.Applicant')
   		.then(function (assetRegistry) {
     		return assetRegistry.update(applicant);

   })
 }
