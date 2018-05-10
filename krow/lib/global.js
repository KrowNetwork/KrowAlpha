"use strict";

var MAX_NAMELENGTH = 255;
var MAX_COUNTRYLENGTH = 31;
var MAX_PHONENUMBERLENGTH = 15;
var MAX_LINKS = 5;
var MAX_LINKLENGTH = 255;

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_REQUESTCOMPLETE = 8;
var JOB_CANCELLED = 16;

var DENIED_EXPIRE = 7 * 24 * 60 * 60 * 1000; //7 days

var NAME_REGEX = new RegExp(/^[\w ,.'-]+$/);

/*
function randomID(length)
{
	var RANDOMSPACE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var id = "";

	for (var i = 0; i < length; i++)
		id += RANDOMSPACE[(Math.random() * RANDOMSPACE.length) >> 0];

	return id;
}
*/

// https://stackoverflow.com/a/2117523

function uuidv4()
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function validateModifyEntity(entity)
{
	if(entity.country)
	{
		if(entity.country.length > MAX_COUNTRYLENGTH)
			throw new RestLimitError("Country name", MAX_COUNTRYLENGTH);
		if(!/^[A-Za-z]{2,}$/.test(entity.country))
			throw new RestError(errno.EINVAL, "Invalid country: " + entity.country);
		entity.country = entity.country.trim();
	}
	if(entity.state)
	{
		if(entity.state.length > MAX_NAMELENGTH)
			throw new RestLimitError("State name", MAX_NAMELENGTH);
		if(!NAME_REGEX.test(entity.state))
			throw new RestError(errno.EINVAL, "Invalid state: " + entity.state);
		entity.state = entity.state.trim();
	}
	if(entity.city)
	{
		if(entity.city.length > MAX_NAMELENGTH)
			throw new RestLimitError("City name", MAX_NAMELENGTH);
		if(!NAME_REGEX.test(entity.city))
			throw new RestError(errno.EINVAL, "Invalid city: " + entity.city);
		entity.city = entity.city.trim();
	}
	if(entity.address)
	{
		if(entity.address.length > MAX_NAMELENGTH)
			throw new RestLimitError("Address", MAX_NAMELENGTH);
		if(!NAME_REGEX.test(entity.address))
			throw new RestError(errno.EINVAL, "Invalid address: " + entity.address);
		entity.address = entity.address.trim();
	}

	if(!/^[a-zA-Z0-9.!#$%^&*`~=_+{}|'/?-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(entity.email))
		throw new RestError(errno.EINVAL, "Invalid email: " + entity.email);

	if(entity.phoneNumber)
	{
		if(entity.phoneNumber.length > MAX_PHONENUMBERLENGTH)
			throw new RestLimitError("Phone number", MAX_PHONENUMBERLENGTH);
		entity.phoneNumber = entity.phoneNumber.replace(/[^0-9+-]/g, "");
	}

	if(entity.links.length > MAX_LINKS)
		throw new RestLimitError("Link count", MAX_LINKS);

	for (var i = 0; i < entity.links.length; i++)
	{
		if(entity.links[i].length > MAX_LINKLENGTH)
			throw new RestLimitError("Link", MAX_LINKLENGTH)
		entity.links[i] = entity.links[i].trim();
	}

	return true;
}

function jobAvailable(job)
{
/*
	if((job.flags & JOB_ACTIVE) == JOB_ACTIVE || (job.flags & JOB_COMPLETE) == JOB_COMPLETE || (job.flags & JOB_CANCELLED) == JOB_CANCELLED)
		return false;
	return (job.flags & JOB_OPEN) == JOB_OPEN;
*/
	return job.flags == JOB_OPEN;
}
