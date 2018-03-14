/**
 * @param {org.krow.transactions.UpdateUserEducation} updateUserEducation - updateUserEducation to be processed
 * @transaction
 */
function UpdateUserEducation(updateUserEducation) {
  // format: {degree: DEGREE, school: SCHOOL, details: DETAILS}

  var factory = getFactory();

  // get json to add
  var jsonText = String(updateUserEducation.user.resume.education);
  //convert to json
  jsonText = JSON.parse(jsonText);

  var count = Object.keys(jsonText).length;
  jsonText[String(count + 1)] = JSON.parse(updateUserEducation.newJson);

  // update
  updateUserEducation.user.resume.education = JSON.stringify(jsonText);
  // update the resume
  return getAssetRegistry('org.krow.assets.Resume')
  		.then(function (assetRegistry) {
    		return assetRegistry.update(updateUserEducation.user.resume);

  })

}
