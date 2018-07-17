"use strict";

var errno = {
	EACCES: 1,
	ENOLIST: 2,
	ENOACTIVE: 3,
	EINVAL: 4,
	EALREADY: 5,
	EUNAVAIL: 6,
	ERELATE: 7,
	ELIMIT: 8,
	EINLIST: 9
};

var error_msg = [
	"Permission Denied", //EACCES
	"Not Listed", //ENOLIST
	"Not Active", //ENOACTIVE
	"Invalid Argument", //EINVAL
	"Already in Use", //EALREADY
	"Unavailable", //EUNAVAIL
	"Wrong Relationship", //ERELATE
	"Resource Limit", //ELIMIT
	"Already in list" //EINLIST
];

class RestError extends Error
{
	constructor(errnum, message)
	{
		super((errnum > 0 ? errnum + ": " + (errnum <= error_msg.length ? error_msg[errnum - 1] : "") : "") + (message === undefined ? "" : ": " + message));
		this.errnum = errnum;
	}
}

class RestInvalidError extends RestError
{
	constructor(name, value)
	{
		super(errno.EINVAL, "Invalid " + name + " value" + (value !== undefined ? ": '" + value + "'" : ""));
	}
}

class RestLimitError extends RestError
{
	constructor(name, maxlen)
	{
		super(errno.ELIMIT, name + " exceeds limit (max " + maxlen + ")");
	}
}

function strerror(errnum)
{
	if(errnum < 1 || errnum > error_msg.length)
		return null;

	return error_msg[errnum - 1];
}
