/**********************************************************************
 *<
	FILE: dllmain.cpp

	DESCRIPTION:   DLL implementation of primitives

	CREATED BY: Charles Thaeler

        BASED on helpers.cpp

	HISTORY: created 12 February 1996

 *>	Copyright (c) 1994, All Rights Reserved.
 **********************************************************************/

#include "webgl.h"

//extern ClassDesc* GetMrBlueDesc();
//extern ClassDesc* GetLODDesc();
extern ClassDesc* GetWebGLDesc();
extern ClassDesc* GetWebGLInsertDesc();
extern ClassDesc* GetWebGLMtlDesc();
extern ClassDesc *GetOmniLightDesc();
extern ClassDesc *GetTSpotLightDesc();
extern ClassDesc *GetDirLightDesc();
extern ClassDesc *GetFSpotLightDesc();
extern ClassDesc* GetPolyCounterDesc();
//extern ClassDesc* GetTimeSensorDesc();
//extern ClassDesc* GetNavInfoDesc();
//extern ClassDesc* GetBackgroundDesc();
#ifndef NO_HELPER_FOG
extern ClassDesc* GetFogDesc();
#endif // NO_HELPER_FOG
//extern ClassDesc* GetAudioClipDesc();
//extern ClassDesc* GetSoundDesc();
//extern ClassDesc* GetTouchSensorDesc();
//extern ClassDesc* GetProxSensorDesc();
//extern ClassDesc* GetAnchorDesc();
//extern ClassDesc* GetBillboardDesc();
//extern ClassDesc* GetCppOutDesc();

HINSTANCE hInstance;
int controlsInit = FALSE;

TCHAR
*GetString(int id)
{
	static TCHAR buf[256];

	if (hInstance)
		return LoadString(hInstance, id, buf, sizeof(buf)) ? buf : NULL;
	return NULL;
}

#define MAX_PRIM_OBJECTS 13

#ifdef _DEBUG
#define NUM_CLASSES (MAX_PRIM_OBJECTS + 1)
#else
#define NUM_CLASSES MAX_PRIM_OBJECTS
#endif

ClassDesc *classDescArray[NUM_CLASSES];
int classDescCount = 0;

void initClassDescArray()
{
   if( !classDescCount )
   {
	   /*
	classDescArray[classDescCount++] = GetAnchorDesc();
	classDescArray[classDescCount++] = GetTouchSensorDesc();
	classDescArray[classDescCount++] = GetProxSensorDesc();
	classDescArray[classDescCount++] = GetTimeSensorDesc();
	classDescArray[classDescCount++] = GetNavInfoDesc();
	classDescArray[classDescCount++] = GetBackgroundDesc();
#ifndef NO_HELPER_FOG
	classDescArray[classDescCount++] = GetFogDesc();
#endif // NO_HELPER_FOG
	classDescArray[classDescCount++] = GetAudioClipDesc();
	classDescArray[classDescCount++] = GetSoundDesc();
	classDescArray[classDescCount++] = GetBillboardDesc();
	classDescArray[classDescCount++] = GetLODDesc();
	*/
	classDescArray[classDescCount++] = GetWebGLDesc();
//	classDescArray[classDescCount++] = GetWebGLInsertDesc();
}
}

/** public functions **/
BOOL WINAPI
DllMain(HINSTANCE hinstDLL,ULONG fdwReason,LPVOID lpvReserved)
{
   if( fdwReason == DLL_PROCESS_ATTACH )
   {
      hInstance = hinstDLL;            // Hang on to this DLL's instance handle.
      DisableThreadLibraryCalls(hInstance);
		}

	return(TRUE);
}

//------------------------------------------------------
// This is the interface to MAX:
//------------------------------------------------------

__declspec( dllexport ) const TCHAR *
LibDescription() {
	return GetString(IDS_LIBDESCRIPTION);
}

__declspec( dllexport ) int LibNumberClasses()
{
   initClassDescArray();

	return classDescCount;
}

__declspec( dllexport ) ClassDesc*
LibClassDesc(int i)
{
   initClassDescArray();

   	if( i < classDescCount )
		return classDescArray[i];
	else
		return 0;
}

// Return version so can detect obsolete DLLs -- NOTE THIS IS THE API VERSION NUMBER
//                                               NOT THE VERSION OF THE DLL.
__declspec( dllexport ) ULONG 
LibVersion() { return VERSION_3DSMAX; }

// Let the plug-in register itself for deferred loading
__declspec( dllexport ) ULONG CanAutoDefer()
{
	return 1;
}
