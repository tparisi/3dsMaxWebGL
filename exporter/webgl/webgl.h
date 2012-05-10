/**********************************************************************
 *<
	FILE: webgl.h

	DESCRIPTION:  Basic includes for modules in webglexp

	CREATED BY: greg finch

	HISTORY: created 9, May 1997

 *>	Copyright (c) 1997, All Rights Reserved.
 **********************************************************************/

#ifndef __WEBGL__H__
#define __WEBGL__H__

#include <stdio.h>
#include "max.h"
#include "resource.h"
#include "iparamm.h"
#include "bmmlib.h"
#include "utilapi.h"
#include "decomp.h"

//#define DDECOMP
#ifdef DDECOMP
#include "cdecomp.h"
#endif

TCHAR *GetString(int id);
// NOTE: There may be some exising macro or function for this?
#define SPRINTF(buf,...) swprintf(buf,(sizeof(buf)/sizeof(TCHAR)),##__VA_ARGS__)

#endif