/**
 * @param {org.krow.transactions.UpdateUserEducation} updateUserEducation - updateUserEducation to be processed
 * @transaction
 */
function UpdateUserEducation(updateUserEducation) {
  // format:  "{\"degree\": \"none\", \"school\": \"nowhere\", \"details\": \"none\"}",

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

/**
 * @param {org.krow.transactions.UpdateUserSkills} updateUserSkills - updateUserSkills to be processed
 * @transaction
 */
function UpdateUserSkills(updateUserSkills) {
  // format:  "{\"skill\": \"none\", \"desc\": \"something\"}"

  var factory = getFactory();

  // get json to add
  var jsonText = String(updateUserSkills.user.resume.skills);
  //convert to json
  jsonText = JSON.parse(jsonText);

  var count = Object.keys(jsonText).length;
  jsonText[String(count + 1)] = JSON.parse(updateUserSkills.newJson);

  // update
  updateUserSkills.user.resume.skills = JSON.stringify(jsonText);
  // update the resume
  return getAssetRegistry('org.krow.assets.Resume')
  		.then(function (assetRegistry) {
    		return assetRegistry.update(updateUserSkills.user.resume);

  })

}
