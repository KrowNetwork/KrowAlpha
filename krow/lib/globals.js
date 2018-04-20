"use strict";

var JOB_OPEN = 1;
var JOB_ACTIVE = 2;
var JOB_COMPLETE = 4;
var JOB_REQUESTCOMPLETE = 8;
var JOB_CANCELLED = 16;

var DENIED_EXPIRE = 7 * 24 * 60 * 60 * 1000; //7 days

var NAME_REGEX = new RegExp(/^[\w ,.'-]+$/);

function randomID(length)
{
	var RANDOMSPACE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var id = "";

	//totally super secure random
	for (var i = 0; i < length; i++)
		id += RANDOMSPACE[(Math.random() * RANDOMSPACE.length) >> 0];

	return id;
}

function validateModifyEntity(entity)
{
	if(entity.country)
	{
		if(!/^[A-Za-z]{2,}$/.test(entity.country))
			throw new RestError(errno.EINVAL, "Invalid country: " + entity.country);
		entity.country = entity.country.trim();
	}
	if(entity.state)
	{
		if(!NAME_REGEX.test(entity.state))
			throw new RestError(errno.EINVAL, "Invalid state: " + entity.state);
		entity.state = entity.state.trim();
	}
	if(entity.city)
	{
		if(!NAME_REGEX.test(entity.city))
			throw new RestError(errno.EINVAL, "Invalid city: " + entity.city);
		entity.city = entity.city.trim();
	}
	if(entity.address)
	{
		if(!NAME_REGEX.test(entity.address))
			throw new RestError(errno.EINVAL, "Invalid address: " + entity.address);
		entity.address = entity.address.trim();
	}

	if(!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(entity.email))
		throw new RestError(errno.EINVAL, "Invalid email: " + entity.email);

	if(entity.phoneNumber)
		entity.phoneNumber = entity.phoneNumber.replace(/[^0-9+-]/g, "");

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
