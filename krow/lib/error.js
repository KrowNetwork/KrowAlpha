"use strict";

var errno = {
	EACCES: 1,
	ENOLIST: 2,
	ENOACTIVE: 3,
	EINVAL: 4,
	EALREADY: 5,
	EUNAVAIL: 6,
	ERELATE: 7
};

var error_msg = [
	"Permission Denied", //EACCES
	"Not Listed", //ENOLIST
	"Not Active", //ENOACTIVE
	"Invalid Argument", //EINVAL
	"Already in Use", //EALREADY
	"Unavailable", //EUNAVAIL
	"Wrong Relationship" //ERELATE
];

class RestError extends Error
{
	constructor(errnum, message)
	{
		super((errnum > 0 ? errnum + ": " + (errnum <= error_msg.length ? error_msg[errnum - 1] : "") : "") + (message === undefined ? "" : ": " + message));
		this.errnum = errnum;
	}
}

function strerror(errnum)
{
	if(errnum < 1 || errnum > error_msg.length)
		return null;

	return error_msg[errnum - 1];
}