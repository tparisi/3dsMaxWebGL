/**********************************************************************
 *<
	FILE: webgl2.cpp

	DESCRIPTION:  webgl file export module

	CREATED BY: Scott Morrison

	HISTORY: created 7 June, 1996

 *>	Copyright (c) 1996, All Rights Reserved.
 **********************************************************************/

#include <time.h>
#include "webgl.h"
#include "simpobj.h"
#include "istdplug.h"
#include "inline.h"
#include "lod.h"
#include "inlist.h"
#include "notetrck.h"
#include "bookmark.h"
#include "stdmat.h"
#include "normtab.h"
#include "webgl_api.h"
#include "webglexp.h"
#include "decomp.h"
#include "timer.h"
#include "navinfo.h"
#include "backgrnd.h"
#include "fog.h"
#include "audio.h"
#include "sound.h"
#include "touch.h"
#include "prox.h"
#include "appd.h"
#include "anchor.h"
#include "bboard.h"
#include "webgl2.h"
#include "pmesh.h"
#include "evalcol.h"
#include <maxscript/maxscript.h>
#include <maxscript/maxwrapper/maxclasses.h>

#ifdef _DEBUG
#define FUNNY_TEST
#endif

//#define TEST_MNMESH
#ifdef TEST_MNMESH
#include "mnmath.h"
#endif

#define MIRROR_BY_VERTICES
// alternative, mirror by scale, is deprecated  --prs.

#define AEQ(a, b) (fabs(a - b) < 0.5 * pow(10.0, -mDigits))

extern TCHAR *GetString(int id);

static HWND hWndPDlg;   // handle of the progress dialog
static HWND hWndPB;     // handle of progress bar 

////////////////////////////////////////////////////////////////////////
// WebGL 2.0 Export implementation
////////////////////////////////////////////////////////////////////////

//#define TEMP_TEST
#ifdef TEMP_TEST
static int getworldmat = 0;
#endif

void AngAxisFromQa(const Quat& q, float *ang, Point3& axis) {
	double omega, s, x, y, z, w, l, c;
	x = (double)q.x;	
	y = (double)q.y;	
	z = (double)q.z;	
	w = (double)q.w;	
	l =  sqrt(x*x + y*y + z*z + w*w);
	if (l == 0.0) {
		w = 1.0;	
		y = z = x = 0.0;
		}
	else {	
		c = 1.0/l;
		x *= c;
		y *= c;
		z *= c;
		w *= c;
		}
	omega = acos(w);
	*ang = (float)(2.0*omega);
	s = sin(omega);	
	if (fabs(s) > 0.000001f)
	{
		axis[0] = (float)(x / s);
		axis[1] = (float)(y / s);
		axis[2] = (float)(z / s);
	}
	else
		axis = Point3(0,0,0); // RB: Added this so axis gets initialized
}


Matrix3
GetLocalTM(INode* node, TimeValue t)
{
	Matrix3 tm;
	tm = node->GetObjTMAfterWSM(t);
#ifdef TEMP_TEST
	if (getworldmat)
		return tm;
#endif
	if (!node->GetParentNode()->IsRootNode()) {
		Matrix3 ip = node->GetParentNode()->GetObjTMAfterWSM(t);
		tm = tm * Inverse(ip);
	}
	return tm;
}

inline float
round(float f)
{
	if (f < 0.0f) {
		if (f > -1.0e-5)
			return 0.0f;
		return f;
	}
	if (f < 1.0e-5)
		return 0.0f;
	return f;
}

void
CommaScan(TCHAR* buf)
{
	for(; *buf; buf++)
	{
		if (*buf == ',')
			*buf = '.';
		if (*buf == ' ')
			*buf = ',';
	}
}

TCHAR*
WebGL2Export::point(Point3& p)
{
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%df %%.%df %%.%df"), mDigits, mDigits, mDigits);
	if (mZUp)
		sprintf(buf, format, round(p.x), round(p.y), round(p.z));
	else
		sprintf(buf, format, round(p.x), round(p.z), round(-p.y));
	CommaScan(buf); // NOTE!: International numbers may contain commas
	return buf;
}

TCHAR*
WebGL2Export::color(Color& c)
{
	static TCHAR buf[50];
	/*
	TCHAR format[20];
	sprintf(format, _T("%%.%dg %%.%dg %%.%dg"), mDigits, mDigits, mDigits);
	sprintf(buf, format, round(c.r), round(c.g), round(c.b));
	*/
	sprintf (buf, "%d", c);
	CommaScan(buf);
	return buf;
}

TCHAR*
WebGL2Export::color(Point3& c)
{
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%dg %%.%dg %%.%dg"), mDigits, mDigits, mDigits);
	sprintf(buf, format, round(c.x), round(c.y), round(c.z));
	CommaScan(buf);
	return buf;
}


TCHAR*
WebGL2Export::floatVal(float f)
{
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%dg"), mDigits);
	sprintf(buf, format, round(f));
	CommaScan(buf);
	return buf;
}


TCHAR*
WebGL2Export::texture(UVVert& uv)
{
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%dg %%.%dg"), mDigits, mDigits);
	sprintf(buf, format, round(uv.x), round(uv.y));
	CommaScan(buf);
	return buf;
}

// Format a scale value
TCHAR*
WebGL2Export::scalePoint(Point3& p)
{
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%dg %%.%dg %%.%dg"), mDigits, mDigits, mDigits);
	if (mZUp)
		sprintf(buf, format, round(p.x), round( p.y), round(p.z));
	else
		sprintf(buf, format, round(p.x), round( p.z), round(p.y));
	CommaScan(buf);
	return buf;
}

// Format a normal vector
TCHAR*
WebGL2Export::normPoint(Point3& p)
{
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%dg %%.%dg %%.%dg"), mDigits, mDigits, mDigits);
	if (mZUp)
		sprintf(buf, format, round(p.x), round(p.y), round(p.z));
	else
		sprintf(buf, format, round(p.x), round(p.z), round(-p.y));
	CommaScan(buf);
	return buf;
}

// Format an axis value
TCHAR*
WebGL2Export::axisPoint(Point3& p, float angle)
{
	if (p == Point3(0., 0., 0.)) 
		p = Point3(1., 0., 0.); // default direction
	static TCHAR buf[50];
	TCHAR format[20];
	sprintf(format, _T("%%.%dg %%.%dg %%.%dg %%.%dg"),
			mDigits, mDigits, mDigits, mDigits);
	if (mZUp)
		sprintf(buf, format, round(p.x), round(p.y), round(p.z),
				round(angle));
	else
		sprintf(buf, format, round(p.x), round(p.z), round(-p.y),
				round(angle));
	CommaScan(buf);
	return buf;
}

// Indent to the given level.
void 
WebGL2Export::Indent(int level)
{
	if (!mIndent) return;
	assert(level >= 0);
	for(; level; level--)
		fprintf(mStream, _T("  "));
}
	
// Translates name (if necessary) to WebGL compliant name.
// Returns name in static buffer, so calling a second time trashes
// the previous contents.
#define CTL_CHARS      31
#define SINGLE_QUOTE   39
static TCHAR * WebGLName(TCHAR *name)
{
	static char buffer[256];
	static int seqnum = 0;
	TCHAR* cPtr;
	int firstCharacter = 1;

	_tcscpy(buffer, name);
	cPtr = buffer;
	while(*cPtr) {
		if( *cPtr <= CTL_CHARS ||
			*cPtr == ' ' ||
			*cPtr == SINGLE_QUOTE ||
			*cPtr == '"' ||
			*cPtr == '\\' ||
			*cPtr == '{' ||
			*cPtr == '}' ||
			*cPtr == ',' ||            
			*cPtr == '.' ||
			*cPtr == '[' ||
			*cPtr == ']' ||
			*cPtr == '-' ||
			*cPtr == '#' ||
			*cPtr >= 127 ||
			(firstCharacter && (*cPtr >= '0' && *cPtr <= '9'))) *cPtr = '_';
		firstCharacter = 0;
		cPtr++;
	}
	if (firstCharacter) {       // if empty name, quick, make one up!
		*cPtr++ = '_';
		*cPtr++ = '_';
		sprintf(cPtr, "%d", seqnum++);
	}
	
	return buffer;
}

// Write beginning of the Transform node.
void
WebGL2Export::StartNode(INode* node, int level, BOOL *isFirst)
{
//	if (!node->IsRootNode())
	if (!*isFirst)
		fprintf (mStream, _T(","));
	*isFirst = FALSE;
	fprintf (mStream, _T("\n"));
/*    
	TCHAR *nodnam = mNodes.GetNodeName(node);
	Indent(level);
	fprintf(mStream, _T("\"%s\": {\n"), nodnam);
	// Put note tracks as info nodes
	int numNotes = node->NumNoteTracks();
	for(int i=0; i < numNotes; i++) {
		DefNoteTrack *nt = (DefNoteTrack*) node->GetNoteTrack(i);
		for (int j = 0; j < nt->keys.Count(); j++) {
			NoteKey* nk = nt->keys[j];
			TSTR note = nk->note;
			if (note.Length() > 0) {
				Indent(level+1);
				fprintf(mStream, _T("#Info { string \"frame %d: %s\" }\n"),
						nk->time/GetTicksPerFrame(), note.data());
			}
		}
	}
*/
}

// Write end of the Transform node.
void
WebGL2Export::EndNode(INode *node, Object* obj, int level, BOOL lastChild)
{
	Indent(level);
	if (lastChild || node->GetParentNode()->IsRootNode())
		fprintf(mStream, _T("}\n"));
	else
		fprintf(mStream, _T("},\n"));    
}

/* test
BOOL
WebGL2Export::IsBBoxTrigger(INode* node)
{
	Object * obj = node->EvalWorldState(mStart).obj;
	if (obj->ClassID() != Class_ID(MR_BLUE_CLASS_ID1, MR_BLUE_CLASS_ID2))
		return FALSE;
	MrBlueObject* mbo = (MrBlueObject*) obj;
	return mbo->GetBBoxEnabled();
}
*/

static BOOL
HasPivot(INode* node)
{
	Point3 p = node->GetObjOffsetPos();
	return p.x != 0.0f || p.y != 0.0f || p.z != 0.0f;
}

// Write out the transform from the parent node to this current node.
// Return true if it has a mirror transform
BOOL
WebGL2Export::OutputNodeTransform(INode* node, int level, BOOL mirrored)
{
	// Root node is always identity
	if (node->IsRootNode())
		return FALSE;
	/* FIX: NEEDS geometry AND material */

	Matrix3 tm = GetLocalTM(node, mStart);
	int i, j;
	Point3 p;
	Point3 s, axis;
	Quat q;
	float ang;

	BOOL isIdentity = TRUE;
	for (i=0;i<3;i++) {
		for (j=0;j<3;j++) {
			if (i==j) {
				if (tm.GetRow(i)[j] != 1.0) isIdentity = FALSE;
			} else if (fabs(tm.GetRow(i)[j]) > 0.00001) isIdentity = FALSE;
		}
	}


	if (isIdentity) {
		p = tm.GetTrans();
#ifdef MIRROR_BY_VERTICES
		if (mirrored)
			p = - p;
#endif
		Indent(level);
		fprintf(mStream, _T("\"position\": [%s],\n"), point(p));
		return FALSE;
	}
	AffineParts parts;
#ifdef DDECOMP
	d_decomp_affine(tm, &parts);
#else
	decomp_affine(tm, &parts);      // parts is parts
#endif
	p = parts.t;
	q = parts.q;
	AngAxisFromQa(q, &ang, axis);
#ifdef MIRROR_BY_VERTICES
		if (mirrored)
			p = - p;
#endif
	Indent(level);
	fprintf(mStream, _T("\"position\": [%s],\n"), point(p));
	Control*rc = node->GetTMController()->GetRotationController();

	if (ang != 0.0f && ang != -0.0f) {
		Indent(level);
		fprintf(mStream, _T("\"rotation\": [%s],\n"), axisPoint(axis, -ang));
	}
	ScaleValue sv(parts.k, parts.u);
	s = sv.s;
#ifndef MIRROR_BY_VERTICES
	if (parts.f < 0.0f)
		s = - s;            // this is where we mirror by scale
#endif
	if (!(AEQ(s.x, 1.0)) || !(AEQ(s.y, 1.0)) || !(AEQ(s.z, 1.0))) {
		Indent(level);
		fprintf(mStream, _T("\"scale\": [%s],\n"), scalePoint(s));
/*
		q = sv.q;
		AngAxisFromQa(q, &ang, axis);
		if (ang != 0.0f && ang != -0.0f) {
			Indent(level);
			fprintf(mStream, _T("scaleOrientation %s\n"),
					axisPoint(axis, -ang));
		}
*/
	}
	return parts.f < 0.0f;
}

static BOOL
MeshIsAllOneSmoothingGroup(Mesh& mesh)
{
	return FALSE;           // to put out normals whenever they're called for

	int numfaces = mesh.getNumFaces();
	unsigned int sg;
	int i;

	for(i = 0; i < numfaces; i++) {
		if (i == 0) {
			sg = mesh.faces[i].getSmGroup();
			if (sg == 0)
				return FALSE;
		}
		else {
			if (sg != mesh.faces[i].getSmGroup())
				return FALSE;
		}
	}
	return TRUE;
}

#define CurrentWidth() (mIndent ? 2*level : 0)
#define MAX_WIDTH 60

int
WebGL2Export::MaybeNewLine(int width, int level)
{
	if (width > MAX_WIDTH) {
		fprintf(mStream, _T("\n"));
		Indent(level);
		return CurrentWidth();
	}
	return width;
}

void
WebGL2Export::OutputNormalIndices(Mesh& mesh, NormalTable* normTab, int level,
								 int textureNum)
{
	Point3 n;
	int numfaces = mesh.getNumFaces();
	int i = 0, j = 0, v = 0, norCnt = 0;
	int width = CurrentWidth();

	Indent(level);
	
	fprintf(mStream, _T("normalIndex [\n"));
	Indent(level+1);
	for (i = 0; i < numfaces; i++) {
		int id = mesh.faces[i].getMatID();
		if (textureNum == -1 || id == textureNum) {
			int smGroup = mesh.faces[i].getSmGroup();
			for(v = 0; v < 3; v++) {
				int cv = mesh.faces[i].v[v];
				RVertex * rv = mesh.getRVertPtr(cv);
				if (rv->rFlags & SPECIFIED_NORMAL) {
					n = rv->rn.getNormal();
					continue;
				}
				else if((norCnt = (int)(rv->rFlags & NORCT_MASK)) != 0 && smGroup) {
					if (norCnt == 1)
						n = rv->rn.getNormal();
					else for(j = 0; j < norCnt; j++) {
						if (rv->ern[j].getSmGroup() & smGroup) {
							n = rv->ern[j].getNormal();
							break;
						}
					}
				} else
					n = mesh.getFaceNormal(i);
				int index = normTab->GetIndex(n);
				assert (index != -1);
				width += fprintf(mStream, _T("%d, "), index);
				width = MaybeNewLine(width, level+1);
			}
			width += fprintf(mStream, _T("-1, "));
			width = MaybeNewLine(width, level+1);
		}
	}
	fprintf(mStream, _T("]\n"));
}

NormalTable*
WebGL2Export::OutputNormals(Mesh& mesh, int level)
{
	int norCnt = 0;
	int numverts = mesh.getNumVerts();
	int numfaces = mesh.getNumFaces();
	NormalTable* normTab;


	mesh.buildRenderNormals();

	if (MeshIsAllOneSmoothingGroup(mesh)) {
		return NULL;
	}

	normTab = new NormalTable();

	// Otherwise we have several smoothing groups
	for (int index = 0; index < numfaces; index++)
	{
		int smGroup = mesh.faces[index].getSmGroup();
		for(int i = 0; i < 3; i++)
		{
			int cv = mesh.faces[index].v[i];
			RVertex * rv = mesh.getRVertPtr(cv);
			if (rv->rFlags & SPECIFIED_NORMAL)
			{
				normTab->AddNormal(rv->rn.getNormal());
			}
			else if((norCnt = (int)(rv->rFlags & NORCT_MASK)) != 0 && smGroup)
			{
				if (norCnt == 1)
					normTab->AddNormal(rv->rn.getNormal());
				else
					for (int j = 0; j < norCnt; j++)
					{
						normTab->AddNormal(rv->ern[j].getNormal());
					}
			}
			else
				normTab->AddNormal(mesh.getFaceNormal(index));
		}
	}

	NormalDesc* nd;
	Indent(level);
	fprintf(mStream, _T("\"normals\" : [\n"));
	int width = CurrentWidth();
	Indent(level+1);

	for (int i = 0, index = 0; i < NORM_TABLE_SIZE; i++)
	{
		for (nd = normTab->Get(i); nd; nd = nd->next)
		{
			nd->index = index++;
			Point3 p = nd->n / NUM_NORMS;
			width += fprintf(mStream, _T("%s, "), normPoint(p));
			width = MaybeNewLine(width, level+1);
		}
	}
	fprintf(mStream, _T("],\n"));
	/*
	Indent(level);
	fprintf(mStream, _T("normalPerVertex TRUE\n"));
	*/
#ifdef DEBUG_NORM_HASH
	normTab->PrintStats(mStream);
#endif

	return normTab;
}

void
WebGL2Export::OutputPolygonObject(INode* node, TriObject* obj, BOOL isMulti,
							 BOOL isWire, BOOL twoSided, int level,
							 int textureNum, BOOL pMirror)
{
#ifdef IfWeEverDoPolyObjs
	assert(obj);
	int width;
	int i, j;
	NormalTable* normTab = NULL;
	TextureDesc* td = NULL;
	BOOL dummy, concave;
	Mesh &mesh = obj->GetMesh();
	int numtverts = mesh.getNumTVerts();
	int numfaces = mesh.getNumFaces();

	PMPoly* poly;
	PMesh polyMesh(obj->GetMesh(), (PType) mPolygonType, numtverts);
	concave = polyMesh.GenPolygons();

	Mtl* mtl = node->GetMtl();
	if (mtl && mtl->IsMultiMtl() && textureNum != -1)
	{
		if (mtl != NULL)
		{
			mtl = mtl->GetSubMtl(textureNum);
			td = GetMtlTex(mtl, dummy);
		}
	}
	else
		td = GetMatTex(node, dummy);
	
	if (!numfaces)
	{
		delete td;
		return;
	}
	
	Indent(level++);
	fprintf(mStream, _T("\"%s_emb\" : {\n"), mNodes.GetNodeName(node));
	/*
	if (!isWire)
	{
		Indent(level);
		fprintf(mStream, _T("ccw %s\n"), pMirror ? _T("FALSE") : _T("TRUE"));
		Indent(level);
		fprintf(mStream, _T("solid %s\n"), twoSided ? _T("FALSE") : _T("TRUE"));
		Indent(level);
		fprintf(mStream, _T("convex %s\n"), concave ? _T("FALSE") : _T("TRUE"));
	}
	*/
 // color-------
	if (mPreLight)
	{
		if (!mCPVSource)   // 1 if MAX, 0 if we calc
		{
			ColorTab vxColDiffTab;
			calcMixedVertexColors(node, mStart, LIGHT_SCENELIGHT, vxColDiffTab);
			int numColors = 0;
			int cfaces;

			Color c;
			Indent(level);
			fprintf(mStream, _T("\"vertexColors\" :  true, // BELONGS IN MATERIAL\n"));
			Indent(level);
			width = CurrentWidth();
			fprintf(mStream, _T("\"colors\" : [\n"));
			Indent(level+1);
			cfaces = vxColDiffTab.Count();
			for (i = 0; i < cfaces; i++)
			{
				c = *((Color*) vxColDiffTab[i]);
				if (i == cfaces - 1)
					width += fprintf(mStream, _T("%s "), c);
				else
					width += fprintf(mStream, _T("%s, "), c);
				width = MaybeNewLine(width, level+1);
			}
			Indent(level);
			fprintf(mStream, _T("],\n"));
/*
			Indent(level);
			fprintf(mStream, _T("colorIndex [\n"));
			width = CurrentWidth();
			Indent(level+1);
			cfaces = polyMesh.GetPolygonCnt();
		 // FIXME need to add colorlist to PMesh
			for (i = 0; i < cfaces; i++) {
				poly = polyMesh.GetPolygon(i);
				for (j = 0; j < poly->GetVIndexCnt(); j++) {
					width += fprintf(mStream, _T("%d, "),
								polyMesh.LookUpVert(poly->GetVIndex(j)));
					width  = MaybeNewLine(width, level+1);
				}
				width += fprintf(mStream, _T("-1"));
				if (i != polyMesh.GetPolygonCnt() - 1) {
					width += fprintf(mStream, _T(", "));
					width = MaybeNewLine(width, level+1);
				}
			}
			fprintf(mStream, _T("]\n"));
*/
			for (i = 0; i < vxColDiffTab.Count(); i++)
				delete (Color*) vxColDiffTab[i];
			vxColDiffTab.ZeroCount();
			vxColDiffTab.Shrink();
		}
		else
		{
			int numCVerts = mesh.getNumVertCol();
			if (numCVerts)
			{
				VertColor vColor;
				Indent(level);
				fprintf(mStream, _T("\"vertexColors\": true, // BELONGS IN MATERIAL\n"));
				Indent(level);
				width = CurrentWidth();
				fprintf(mStream, _T("\"colors\" : [\n"));
				Indent(level+1);

				int nVerts = polyMesh.GetVertexCnt();
				for (i = 0; i < nVerts; i++) {
					/*
					for (j = 0; j < poly->GetVIndexCnt(); j++) {
						width += fprintf(mStream, _T("%d, "),
									polyMesh.LookUpVert(poly->GetVIndex(j)));
						width  = MaybeNewLine(width, level+1);
					}
					*/
					int vIndex = polyMesh.LookUpVert(i);

					if (vIndex > numCVerts) {
						assert(FALSE);
						break;
					}

					vColor = mesh.vertCol[vIndex];
					if (i == nVerts - 1)
						width += fprintf(mStream, _T("%s "), vColor);
					else
						width += fprintf(mStream, _T("%s, "), vColor);
					width = MaybeNewLine(width, level+1);
				}
				Indent(level);
				fprintf(mStream, _T("],\n"));
/*
				Indent(level);
				fprintf(mStream, _T("colorIndex [\n"));
				width = CurrentWidth();
				Indent(level+1);
				int cfaces = polyMesh.GetPolygonCnt();
			 // FIXME need to add colorlist to PMesh
				for (i = 0; i < cfaces; i++) {
					poly = polyMesh.GetPolygon(i);
					for (j = 0; j < poly->GetVIndexCnt(); j++) {
						width += fprintf(mStream, _T("%d, "),
									polyMesh.LookUpVert(poly->GetVIndex(j)));
						width  = MaybeNewLine(width, level+1);
					}
					width += fprintf(mStream, _T("-1"));
					if (i != polyMesh.GetPolygonCnt() - 1) {
							width += fprintf(mStream, _T(", "));
							width = MaybeNewLine(width, level+1);
					}
				}
				fprintf(mStream, _T("]\n"));
		*/
			}
			else
			{
				mPreLight = FALSE;
			}
		}
	}

	int numColors = 0;
	if (!mPreLight && isMulti && textureNum == -1)
	{
		Color c;
		Indent(level);
		fprintf(mStream, _T("\"vertextColors\" : false, // BELONGS IN MATERIAL\n"));
		Mtl* sub, * mtl = node->GetMtl();
		assert (mtl->IsMultiMtl());
		int num = mtl->NumSubMtls();
		Indent(level);
		width = CurrentWidth();
	 
		fprintf(mStream, _T("\"colors\" : [\n"));
		Indent(level+1);
		for (i = 0; i < num; i++)
		{
			sub = mtl->GetSubMtl(i);
			if (!sub) continue;
			numColors++;
			c = sub->GetDiffuse(mStart);
			if (i == num - 1)
				width += fprintf(mStream, _T("%s "), color(c));
			else
				width += fprintf(mStream, _T("%s, "), color(c));
			width = MaybeNewLine(width, level+1);
		}
		Indent(level);
		fprintf(mStream, _T("],\n"));
	}
	/*
	if (!mPreLight && isMulti && numColors > 0 && textureNum == -1)
	{
		Indent(level);
		fprintf(mStream, _T("colorIndex [\n"));
		width = CurrentWidth();
		Indent(level+1);
		numfaces = polyMesh.GetPolygonCnt();
	 // FIXME need to add colorlist to PMesh
		for (i = 0; i < numfaces; i++) {
			poly = polyMesh.GetPolygon(i);
			int matID = mesh.faces[poly->GetTriFace(0)].getMatID();
			matID  = (matID % numColors);
			width += fprintf(mStream, _T("%d"), matID);
			if (i != numfaces - 1) {
				width += fprintf(mStream, _T(", "));
				width  = MaybeNewLine(width, level+1);
			}
		}
		fprintf(mStream, _T("]\n"));
	}
	*/
 // output coordinate---------
	if (textureNum < 1)
	{
		Indent(level);
		fprintf(mStream, _T("\"vertices\" : [\n"));
		width = CurrentWidth();
		Indent(level+1);
		for (i = 0; i < polyMesh.GetVertexCnt(); i++)
		{
			Point3 p = polyMesh.GetVertex(i);
#ifdef MIRROR_BY_VERTICES
			if (pMirror)
				p = - p;
#endif
			width += fprintf(mStream, _T("%s"), point(p));
			if (i == polyMesh.GetVertexCnt() - 1)
			{
				fprintf(mStream, _T("],\n"));
			}
			else
			{
				width += fprintf(mStream, _T(", "));
				width = MaybeNewLine(width, level+1);
			}
		}
	}
	else
	{
		/*
		Indent(level);
		fprintf(mStream, _T("coord USE %s-COORD\n"),
				mNodes.GetNodeName(node));
		*/
	}
	/*
 // Output Texture coordinates
	if (numtverts > 0 && (td || textureNum == 0) && !isWire)
	{
		if (textureNum < 1)
		{
			Indent(level);
			fprintf(mStream, _T("texCoord DEF %s-TEXCOORD TextureCoordinate { point [\n"),
				mNodes.GetNodeName(node));
			width = CurrentWidth();
			Indent(level+1);
			for (i = 0; i < polyMesh.GetTVertexCnt(); i++) {
				UVVert t = polyMesh.GetTVertex(i);
				width += fprintf(mStream, _T("%s"), texture(t));
				if (i == polyMesh.GetTVertexCnt() - 1) {
					fprintf(mStream, _T("]\n"));
					Indent(level);
					fprintf(mStream, _T("}\n"));
				}
				else {
					width += fprintf(mStream, _T(", "));
					width = MaybeNewLine(width, level+1);
				}
			}
		} else {
			Indent(level);
			fprintf(mStream, _T("texCoord USE %s-TEXCOORD\n"),
					mNodes.GetNodeName(node));
		}
	}
	
	if (numtverts > 0 && td && !isWire) {
		Indent(level);
		fprintf(mStream, _T("texCoordIndex [\n"));
		Indent(level+1);
		width = CurrentWidth();
		int tmp = polyMesh.GetPolygonCnt();
		//for (i = 0; i < polyMesh.GetPolygonCnt(); i++) {
		for (i = 0; i < tmp; i++) {
			poly = polyMesh.GetPolygon(i);
			int tmp1 = poly->GetTVIndexCnt();
			//for (j = 0; j < poly->GetTVIndexCnt(); j++) {
			for (j = 0; j < tmp1; j++) {
				int tmp2 = poly->GetTVIndex(j);
				int tmp3 = polyMesh.LookUpTVert(tmp2);
				width += fprintf(mStream, _T("%d, "),
								//polyMesh.LookUpTVert(poly->GetTVIndex(j)));
								tmp3);
				width  = MaybeNewLine(width, level+1);
			}
			width += fprintf(mStream, _T("-1"));
			if (i != polyMesh.GetPolygonCnt() - 1) {
				width += fprintf(mStream, _T(", "));
				width = MaybeNewLine(width, level+1);
			}
		}
		fprintf(mStream, _T("]\n"));
	}
*/	
 // output normals
	if (mGenNormals && !isWire && !MeshIsAllOneSmoothingGroup(mesh))
	{
		NormalTable* normTab = NULL;
		normTab = new NormalTable();
	
		for (j = 0; j < polyMesh.GetPolygonCnt(); j++)
		{
			//Point3 n = polyMesh.GetPolygon(j)->GetFNormal();
			for (int k = 0; k < polyMesh.GetPolygon(j)->GetVNormalCnt(); k++)
			{
				Point3 n = polyMesh.GetPolygon(j)->GetVNormal(k);
				normTab->AddNormal(n);
			}
		}
		
		Indent(level);
		fprintf(mStream, _T("\"normalPerVertex\" : true, // in material?\n"));
		int index = 0;
		NormalDesc* nd;
		Indent(level);
		fprintf(mStream, _T("\"normals\" : [\n"));
		width = CurrentWidth();
		Indent(level+1);
/*
		for (i = 0; i < polyMesh.GetPolygonCnt(); i++) {
			Point3 n = polyMesh.GetPolygon(i)->GetFNormal();
			normTab->AddNormal(n);
			width += fprintf(mStream, _T("%s, "), normPoint(n));
			width  = MaybeNewLine(width, level+1);
		}
*/

		for (i = 0; i < NORM_TABLE_SIZE; i++)
		{
			for (nd = normTab->Get(i); nd; nd = nd->next)
			{
				nd->index = index++;
				Point3 n  = nd->n / NUM_NORMS;
				width    += fprintf(mStream, _T("%s, "), normPoint(n));
				width     = MaybeNewLine(width, level+1);
			}
		}
		fprintf(mStream, _T("],\n"));
	/*
		Indent(level);
		width = CurrentWidth();
		fprintf(mStream, _T("normalIndex [\n"));
		Indent(level+1);
		width = CurrentWidth();
	  
		for (i = 0; i < polyMesh.GetPolygonCnt(); i++) {
			int index;
			for (int k = 0; k < polyMesh.GetPolygon(i)->GetVNormalCnt(); k++) {
				Point3 n = polyMesh.GetPolygon(i)->GetVNormal(k);
				index    = normTab->GetIndex(n);
				width   += fprintf(mStream, _T("%d, "), index);
				width    = MaybeNewLine(width, level+1);
			}
			width += fprintf(mStream, _T("-1, "));
			width = MaybeNewLine(width, level+1);
		}
		normTab->PrintStats(mStream);
	*/
		fprintf(mStream, _T("]\n"));  
	
		delete normTab;
	}

	Indent(level);
	fprintf(mStream, _T("\"faces\" : [\n"));
	Indent(level+1);
	width = CurrentWidth();
	for (i = 0; i < polyMesh.GetPolygonCnt(); i++)
	{
		poly = polyMesh.GetPolygon(i);
		for (j = 0; j < poly->GetVIndexCnt(); j++)
		{
			width += fprintf(mStream, _T("%d, "),
							polyMesh.LookUpVert(poly->GetVIndex(j)));
			width  = MaybeNewLine(width, level+1);
		}
		width += fprintf(mStream, _T("-1"));
		if (i != polyMesh.GetPolygonCnt() - 1)
		{
			width += fprintf(mStream, _T(", "));
			width = MaybeNewLine(width, level+1);
		}
	}
	fprintf(mStream, _T("]\n"));

	Indent(level);
	fprintf(mStream, _T("}"));
	fflush (mStream);
	delete td;
#endif	
}

// Write out the data for a single triangle mesh
void
WebGL2Export::OutputTriObject(INode* node, TriObject* obj, BOOL isMulti,
							 BOOL isWire, BOOL twoSided, int level,
							 int textureNum, BOOL pMirror)
{
	assert(obj);
	Mesh &mesh = obj->GetMesh();
	int numverts = mesh.getNumVerts();
	int numtverts = mesh.getNumTVerts();
	int numfaces = mesh.getNumFaces();
	int i, width;
	NormalTable* normTab = NULL;
	TextureDesc* td = NULL;
	BOOL dummy;

	Mtl *mtl = node->GetMtl();
	if (mtl && mtl->IsMultiMtl() && textureNum != -1)
	{
		if (mtl != NULL)
		{
			mtl = mtl->GetSubMtl(textureNum);
			td = GetMtlTex(mtl, dummy);
		}
	}
	else
		td = GetMatTex(node, dummy);
	
	if (numfaces == 0)
	{
		delete td;
		return;
	}
	
	Indent(level++);
	fprintf(mStream, _T("\"%s_emb\" : {\n"), mNodes.GetNodeName(node));
/*
	if (!isWire)
	{
		Indent(level);
		fprintf(mStream, _T("ccw %s\n"), pMirror ? _T("FALSE") : _T("TRUE"));
		Indent(level);
		fprintf(mStream, _T("solid %s\n"),
							twoSided ? _T("FALSE") : _T("TRUE"));
	}
*/
	if (mPreLight)
	{
		if (!mCPVSource)  // 1 if MAX, 0 if we calc
		{
			ColorTab vxColDiffTab;
			calcMixedVertexColors(node, mStart, LIGHT_SCENELIGHT, vxColDiffTab);
			int numColors = 0;
			int cfaces;
			Color c;
			Indent(level);
			fprintf(mStream, _T("\"vertexColors\": true // THIS BELONGS IN MATERIAL\n"));
			Indent(level);
			width = CurrentWidth();
			fprintf(mStream, _T("\"colors\": [\n"));
			Indent(level+1);
			cfaces = vxColDiffTab.Count();
			for (i = 0; i < cfaces; i++)
			{
				c = *((Color*) vxColDiffTab[i]);
				if (i == cfaces - 1)
					width += fprintf(mStream, _T("%s "), c);
				else
					width += fprintf(mStream, _T("%s, "), c);
				width = MaybeNewLine(width, level+1);
			}
			Indent(level);
			fprintf(mStream, _T("],\n"));
/*
			Indent(level);
			fprintf(mStream, _T("colorIndex [\n"));
			width = CurrentWidth();
			Indent(level+1);

			for (i = 0; i < numfaces; i++)
			{
				width += fprintf(mStream, _T("%d, %d, %d, -1"),
							mesh.faces[i].v[0], mesh.faces[i].v[1],
							mesh.faces[i].v[2]);
				if (i != numfaces-1)
				{
					width += fprintf(mStream, _T(", "));
					width = MaybeNewLine(width, level+1);
				}
			}
			fprintf(mStream, _T("]\n"));
*/
			for (i = 0; i < vxColDiffTab.Count(); i++)
				delete (Color*) vxColDiffTab[i];

			vxColDiffTab.ZeroCount();
			vxColDiffTab.Shrink();
		}
		else
		{
			int numCVerts = mesh.getNumVertCol();
			if (numCVerts)
			{
				VertColor vColor;
				Indent(level);
				fprintf(mStream, _T("\"vertexColors\": true // THIS GOES IN MATERIAL!\n"));
				Indent(level);
				width = CurrentWidth();
				fprintf(mStream, _T("\"colors\" : [\n"));
				Indent(level+1);
			 // FIXME need to add colorlist to PMesh
				for (i = 0; i < numverts; i++)
				{
					vColor = mesh.vertCol[i];
					if (i == numverts - 1)
						width += fprintf(mStream, _T("%s "), vColor);
					else
						width += fprintf(mStream, _T("%s, "), vColor);
					width = MaybeNewLine(width, level+1);
				}
				Indent(level);
				fprintf(mStream, _T("],\n"));
/*
				Indent(level);
				fprintf(mStream, _T("colorIndex [\n"));
				width = CurrentWidth();
				Indent(level+1);

				for (i = 0; i < numfaces; i++) {
					int id = mesh.faces[i].getMatID();
					if (textureNum == -1 || id == textureNum) {
						if (!(mesh.faces[i].flags & FACE_HIDDEN)) {
							width += fprintf(mStream, _T("%d, %d, %d, -1"),
									mesh.faces[i].v[0], mesh.faces[i].v[1],
									mesh.faces[i].v[2]);
							if (i != numfaces-1) {
								width += fprintf(mStream, _T(", "));
								width = MaybeNewLine(width, level+1);
							}
						}
					}
				}
				fprintf(mStream, _T("]\n"));
*/
			}
			else
			{
				mPreLight = FALSE;
			}
		}
	}

	int numColors = 0;
	if (!mPreLight && isMulti && textureNum == -1)
	{
		Color c;
		Indent(level);
		fprintf(mStream, _T("\"vertexColors\" : false // THIS BELONGS IN MATERIAL\n"));
		Mtl *sub, *mtl = node->GetMtl();
		assert (mtl->IsMultiMtl());
		int num = mtl->NumSubMtls();
		Indent(level);
		width = CurrentWidth();
		fprintf(mStream, _T("\"colors\" : [\n"));
		Indent(level+1);
		for (i = 0; i < num; i++)
		{
			sub = mtl->GetSubMtl(i);
			if (!sub)
				continue;
			numColors++;
			c = sub->GetDiffuse(mStart);
			if (i == num - 1)
				width += fprintf(mStream, _T("%s "), c);
			else
				width += fprintf(mStream, _T("%s, "), c);
			width = MaybeNewLine(width, level+1);
		}
		Indent(level);
		fprintf(mStream, _T("],\n"));
	}

	if (textureNum < 1)
	{
		// Output the vertices
		Indent(level);
		fprintf(mStream, _T("\"vertices\" : [\n"));
		
		width = CurrentWidth();
		Indent(level+1);
		for (i = 0; i < numverts; i++)
		{
			Point3 p = mesh.verts[i];
#ifdef MIRROR_BY_VERTICES
			if (pMirror)
				p = - p;
#endif
			width += fprintf(mStream, _T("%s"), point(p));
			if (i == numverts-1)
			{
				fprintf(mStream, _T("],\n"));
			}
			else
			{
				width += fprintf(mStream, _T(", "));
				width = MaybeNewLine(width, level+1);
			}
		}
	}
	else // texture num > 0
	{
		Indent(level);
		fprintf(mStream, _T("TO DO AROUND LINE 1203\n"),mNodes.GetNodeName(node));
	}
	// Output the normals
	// FIXME share normals on multi-texture objects
	if (mGenNormals && !isWire)
	{
		normTab = OutputNormals(mesh, level);
	}

	// Output Texture coordinates (UV's)
	Indent(level);
	fprintf(mStream, _T("\"uvs\" : [[\n"),mNodes.GetNodeName(node));
	if (numtverts > 0 && (td || textureNum == 0) && !isWire)
	{
		if (textureNum < 1)
		{
			width = CurrentWidth();
			Indent(level+1);
			for (i = 0; i < numtverts; i++)
			{
				if (i > 0)
				{
					width += fprintf(mStream, _T(", "));
					width = MaybeNewLine(width, level+1);
				}
				Point3 uvw = mesh.tVerts[i];
				UVVert p = mesh.getTVert(i);
				width += fprintf(mStream, _T("%s"), texture(p));
			}
		}
		/*
		else
		{
			Indent(level);
			fprintf(mStream, _T("texCoord USE %s-TEXCOORD\n"),mNodes.GetNodeName(node));
		}
		*/
	}
	fprintf(mStream, _T("]],\n"));

	/*
	if (numtverts > 0 && td && !isWire) {
		Indent(level);
		fprintf(mStream, _T("texCoordIndex [\n"));
		Indent(level+1);
		width = CurrentWidth();
		for(i = 0; i < numfaces; i++) {
			int id = mesh.faces[i].getMatID();
			if (textureNum == -1 || id == textureNum) {
				if (!(mesh.faces[i].flags & FACE_HIDDEN)) {
					width += fprintf(mStream, _T("%d, %d, %d, -1"),
									 mesh.tvFace[i].t[0], mesh.tvFace[i].t[1],
									 mesh.tvFace[i].t[2]);
					if (i != numfaces-1) {
						width += fprintf(mStream, _T(", "));
						width = MaybeNewLine(width, level+1);
					}
				}
			}
		}
		fprintf(mStream, _T("]\n"));
	}

	if (!mPreLight && isMulti && numColors > 0 && textureNum == -1) {
		Indent(level);
		fprintf(mStream, _T("colorIndex [\n"));
		width = CurrentWidth();
		Indent(level+1);
		for(i = 0; i < numfaces; i++) {
			if (!(mesh.faces[i].flags & FACE_HIDDEN)) {
				int id = mesh.faces[i].getMatID();
				id = (id % numColors);   // this is the way MAX does it
//				if (id >= numColors)
//					id = 0;
				width += fprintf(mStream, _T("%d"), id);
				if (i != numfaces-1) {
					width += fprintf(mStream, _T(", "));
					width = MaybeNewLine(width, level+1);
				}
			}
		}
		fprintf(mStream, _T("],\n"));
	}
*/
	if (mGenNormals && normTab && !isWire) {
		OutputNormalIndices(mesh, normTab, level, textureNum);
		delete normTab;
	}
		
	// Output the triangles
	Indent(level);
	fprintf(mStream, _T("\"faces\" : [\n"));
	Indent(level+1);
	width = CurrentWidth();
	for (i = 0; i < numfaces; i++)
	{
/*
	isQuad          	= isBitSet( type, 0 );
	hasMaterial         = isBitSet( type, 1 );
	hasFaceUv           = isBitSet( type, 2 );
	hasFaceVertexUv     = isBitSet( type, 3 );
	hasFaceNormal       = isBitSet( type, 4 );
	hasFaceVertexNormal = isBitSet( type, 5 );
	hasFaceColor	    = isBitSet( type, 6 );
	hasFaceVertexColor  = isBitSet( type, 7 );
*/
		int bitField = 0;
		bitField |= 2;

		int id = mesh.faces[i].getMatID();
		if (textureNum == -1 || id == textureNum)
		{
			if (!(mesh.faces[i].flags & FACE_HIDDEN))
			{
				if (i > 0)
				{
					width += fprintf(mStream, _T(", "));
					width = MaybeNewLine(width, level+1);
				}
				width += fprintf(mStream, _T("%d, %d, %d, %d, 0"), bitField,
								 mesh.faces[i].v[0], mesh.faces[i].v[1],
								 mesh.faces[i].v[2]);
			}
		}
	}
	fprintf(mStream, _T("]\n"));

	Indent(level);
	fprintf(mStream, _T("}"));
	delete td;

}

BOOL
WebGL2Export::HasTexture(INode* node, BOOL &isWire)
{
	TextureDesc* td = GetMatTex(node, isWire);
	if (!td)
		return FALSE;
	delete td;
	return TRUE;
}

TSTR
WebGL2Export::PrefixUrl(TSTR& fileName)
{
	if (mUsePrefix && mUrlPrefix.Length() > 0) {
		if (mUrlPrefix[mUrlPrefix.Length() - 1] != '/') {
			TSTR slash = "/";
			return mUrlPrefix + slash + fileName;
		} else
			return mUrlPrefix + fileName;
	}
	else
		return fileName;
}
	
// Get the name of the texture file
TextureDesc*
WebGL2Export::GetMatTex(INode* node, BOOL& isWire)
{
	Mtl* mtl = node->GetMtl();
	return GetMtlTex(mtl, isWire);
}


TextureDesc*
WebGL2Export::GetMtlTex(Mtl* mtl, BOOL& isWire)
{
	if (!mtl)
		return NULL;

	
	if (mtl->ClassID() != Class_ID(DMTL_CLASS_ID, 0))
		return NULL;

	StdMat* sm = (StdMat*) mtl;

	isWire = sm->GetWire();

	// Check for texture map
	Texmap* tm = (BitmapTex*) sm->GetSubTexmap(ID_DI);
	if (!tm)
		return NULL;

	if (tm->ClassID() != Class_ID(BMTEX_CLASS_ID, 0))
		return NULL;
	BitmapTex* bm = (BitmapTex*) tm;

	TSTR bitmapFile;
	TSTR fileName;

	bitmapFile = bm->GetMapName();
	if (bitmapFile.data() == NULL)
		return NULL;
	int l = static_cast<int>(_tcslen(bitmapFile)-1);	// SR DCAST64: Downcast to 2G limit.
	if (l < 0)
		return NULL;
	
	TSTR path;
	SplitPathFile(bitmapFile, &path, &fileName);

	TSTR url = PrefixUrl(fileName);
	TextureDesc* td = new TextureDesc(bm, fileName, url);
	return td;
}

BOOL
WebGL2Export::OutputMaterial(INode* node, BOOL& isWire, BOOL& twoSided,
							int level, int textureNum, BOOL *isFirst, ClassToFind targetClass)
{
	Mtl* mtl = node->GetMtl();
	BOOL isMulti = FALSE;
	isWire = FALSE;
	twoSided = FALSE;

	if (mtl && mtl->IsMultiMtl())
	{
		if (textureNum > -1)
			mtl = mtl->GetSubMtl(textureNum);
		else
			mtl = mtl->GetSubMtl(0);
		isMulti = TRUE;
		// Use first material for specular, etc.
	}

	// If no material is assigned, use the wire color
	if (!mtl || (mtl->ClassID() != Class_ID(DMTL_CLASS_ID, 0) &&
				 mtl->ClassID() != Class_ID(0x3e0810d6, 0x603532f0)))
	{
		Color col(node->GetWireColor());
//		fprintf (mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
		if (targetClass == MATERIALS)
		{
			Indent(level);
			StartNode (node, level, isFirst);
			fprintf (mStream, _T("\"wire\":\n"));
		}
		else if (targetClass == OBJECTS)
		{
			if (!*isFirst)
				fprintf (mStream, _T(","));
			fprintf (mStream, _T("\"wire\""));
			return FALSE; // just here for the name
		}
		Indent(level+1);
//		"type": "MeshBasicMaterial",
//		"parameters": { "color": 6710886, "wireframe": true }
		fprintf(mStream, _T("\"type\": \"MeshLambertMaterial\",\n"));
		Indent(level+1);
		fprintf(mStream, _T("\"parameters\": {\n"));
		Indent(level+2);
		fprintf(mStream, _T("\"color\": %d,"), col);
		Indent(level+2);
		fprintf(mStream, _T("\"shading\": \"flat\"\n"), col);
		Indent(level+1);
		fprintf(mStream, _T("}\n"));
		Indent(level);
		fprintf(mStream, _T("}\n"));
		return FALSE;
	}

	StdMat* sm = (StdMat*) mtl;
	isWire = sm->GetWire();
	twoSided = sm->GetTwoSided();

	Interval i = FOREVER;
	sm->Update(0, i);
//	fprintf (mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
	if (targetClass == MATERIALS)
	{
		StartNode (node, level, isFirst);
		Indent(level);
		fprintf (mStream, _T("\"%s\": {\n"), mtl->GetName());
	}
	else if (targetClass == OBJECTS)
	{
		if (!*isFirst)
			fprintf (mStream, _T(","));
		fprintf (mStream, _T("\"wire\""));
		return FALSE; // just here for the name
	}

	Color c;

	if (targetClass == MATERIALS)
	{
		Indent(level+1);
		c = sm->GetDiffuse(mStart);
//		"type": "MeshBasicMaterial",
//		"parameters": { "color": 6710886, "wireframe": true }
		fprintf(mStream, _T("\"type\": \"MeshLambertMaterial\",\n"));
		Indent(level+1);
		fprintf(mStream, _T("\"parameters\": {\n"));
		Indent(level+2);
		fprintf(mStream, _T("\"color\": %d,\n"), c);
		Indent(level+2);
		fprintf(mStream, _T("\"shading\": \"flat\",\n"));
//		fprintf(mStream, _T("\"colorDiffuse\": %d,\n"), c);
//		Indent(level+1);
//		float difin = (c.r+c.g+c.b) / 3.0f;
//		c = sm->GetAmbient(mStart);
//		float ambin = (c.r+c.g+c.b) / 3.0f;
//		if (ambin >= difin)
//			fprintf(mStream, _T("\"ambientIntensity\": 1.0,\n"));
//		else
//			fprintf(mStream, _T("\"ambientIntensity\": %s,\n"), floatVal(ambin/difin));
		Indent(level+2);
		c = sm->GetSpecular(mStart);
		c *= sm->GetShinStr(mStart);
		fprintf(mStream, _T("\"colorSpecular\": %d,\n"), c);
		float sh = sm->GetShininess(mStart);
		sh = sh * 0.95f + 0.05f;
		Indent(level+2);
		fprintf(mStream, _T("\"specularCoef\": %s,\n"), floatVal(sh));
		Indent(level+2);
		fprintf(mStream, _T("\"opacity\": %s,\n"), floatVal(sm->GetOpacity(mStart)));
		float si = sm->GetSelfIllum(mStart);
		if (si > 0.0f)
		{
			Indent(level+2);
			c = sm->GetDiffuse(mStart);
			Point3 p = si*Point3(c.r, c.g, c.b);
			fprintf(mStream, _T("\"colorEmissive\": %d,\n"), p);
		}
	}
/*
	if (isMulti && textureNum == -1) {
		Indent(level--);
		fprintf(mStream, _T("}\n"));
		return TRUE;
	}
*/
	BOOL dummy;
	TextureDesc* td = GetMtlTex(mtl, dummy);
	if (!td)
	{
		Indent(level--);
//		fprintf(mStream, _T("}\n"));
		return FALSE;
	}
	if (targetClass == MATERIALS)
	{
		Indent(level+2);
		fprintf(mStream, _T("\"map\" : \"%s\"\n"), td->name);
	}
	else if (targetClass == TEXTURES)
	{
		Indent(level+1);
		fprintf(mStream, _T("\"%s\" : {\n"), td->name);
		Indent(level+1);
		fprintf(mStream, _T("\"url\" : \"%s\"\n"), td->url);
	}
	// fprintf(mStream, _T("repeatS TRUE\n"));
	// fprintf(mStream, _T("repeatT TRUE\n"));
	Indent(level+1);
	fprintf(mStream, _T("}\n"));
	Indent(level);
	fprintf(mStream, _T("}\n"));

	BitmapTex* bm = td->tex;
	delete td;
	/*
	if (targetClass == EMBEDS)
	{
		StdUVGen* uvGen = bm->GetUVGen();
		if (!uvGen)
			return FALSE;

		float uOff = uvGen->GetUOffs(mStart);
		float vOff = uvGen->GetVOffs(mStart);
		float uScl = uvGen->GetUScl(mStart);
		float vScl = uvGen->GetVScl(mStart);
		float ang =  uvGen->GetAng(mStart);

		if (uOff == 0.0f && vOff == 0.0f && uScl == 1.0f && vScl == 1.0f &&
			ang == 0.0f) {
			Indent(--level);
			fprintf(mStream, _T("}"));
			return FALSE;
		}
		Indent(level);
		fprintf(mStream, _T("textureTransform TextureTransform {\n"));
		Indent(level+1);
		fprintf(mStream, _T("center 0.5 0.5\n"));
		if (uOff != 0.0f || vOff != 0.0f)
		{
			Indent(level+1);
			UVVert uv = UVVert(uOff+0.5f, vOff+0.5f, 0.0f);
			fprintf(mStream, _T("\"translation\": [%s],\n"), texture(uv));
		}
		
		if (ang != 0.0f)
		{
			Indent(level+1);
			fprintf(mStream, _T("\"rotation\": %s\n"), floatVal(ang));
		}
		
		if (uScl != 1.0f || vScl != 1.0f)
		{
			Indent(level+1);
			UVVert uv = UVVert(uScl, vScl, 0.0f);
			fprintf(mStream, _T("\"scale\": [%s]\n"), texture(uv));
		}
	//	Indent(level);
	//	fprintf(mStream, _T("}"));
	}
		*/
	Indent(--level);
	return FALSE;
}


#define INTENDED_ASPECT_RATIO 1.3333

BOOL
WebGL2Export::WebGLOutCamera(INode* node, Object* obj, int level)
{
	// compute camera transform
	ViewParams vp;
	CameraState cs;
	Interval iv;
	CameraObject *cam = (CameraObject *)obj;
	cam->EvalCameraState(0, iv, &cs);
	vp.fov = (float)(2.0 * atan(tan(cs.fov / 2.0) / INTENDED_ASPECT_RATIO));

	Indent(level);
	fprintf(mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("\"type\": \"perspective\",\n"));
	Indent(level+1);
	fprintf(mStream, _T("\"position\": [0, 0, 0],\n"));
	Indent(level+1);
	fprintf(mStream, _T("\"fov\": %s\n"), floatVal(vp.fov));
	Indent(level);
	fprintf(mStream, _T("}"));

	return TRUE;
}

#define FORDER(A, B) if (B < A) { float fOO = A; A = B; B = fOO; }


static INode *
GetTopLevelParent(INode* node)
{
	while(!node->GetParentNode()->IsRootNode())
		node = node->GetParentNode();
	return node;
}

BOOL
WebGL2Export::WebGLOutPointLight(INode* node, LightObject* light, int level, BOOL top)
{
	LightState ls;
	Interval iv = FOREVER;

	light->EvalLightState(mStart, iv, &ls);

	Indent(level);
	fprintf(mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("\"type\": \"point\",\n"));
	Indent(level+1);
	fprintf(mStream, _T("\"intensity\": %s,\n"),
			floatVal(light->GetIntensity(mStart, FOREVER)));
	Indent(level+1);
	Point3 col = light->GetRGBColor(mStart, FOREVER);
	fprintf(mStream, _T("\"color\": %d,\n"), col);
	Indent(level+1);
	if (top)
	{
		Point3 p = node->GetObjTMAfterWSM(mStart).GetTrans();
		fprintf(mStream, _T("\"position\": [%s],\n"), point(p));
	}
	else
		fprintf(mStream, _T("\"position\": [0, 0, 0],\n"));
/*
	Indent(level+1);
	fprintf(mStream, _T("on %s\n"), ls.on ? _T("TRUE") : _T("FALSE"));
*/
	if (ls.useAtten) {
		Indent(level+1);
		fprintf(mStream, _T("attenuation [0 1 0],\n"));
	}
	Indent(level+1);
	fprintf(mStream, _T("\"radius\": %s\n"), floatVal(ls.attenEnd));
	Indent(level);
	fprintf(mStream, _T("}"));
	return TRUE;
}

BOOL
WebGL2Export::WebGLOutDirectLight(INode* node, LightObject* light, int level, BOOL top)
{
	Point3 dir(0,0,-1);

	LightState ls;
	Interval iv = FOREVER;

	light->EvalLightState(mStart, iv, &ls);

	Indent(level);
	fprintf(mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("\"type\": \"directional\",\n"));
	Indent(level+1);
	fprintf(mStream, _T("\"intensity\": %s,\n"),
			floatVal(light->GetIntensity(mStart, FOREVER)));
	Indent(level+1);
	if (top)
	{
		Point3 p = Point3(0,0,-1);
		Matrix3 tm = node->GetObjTMAfterWSM(mStart);
		Point3 trans, s;
		Quat q;
		AffineParts parts;
		decomp_affine(tm, &parts);
		q = parts.q;
		Matrix3 rot;
		q.MakeMatrix(rot);
		p = p * rot;
		fprintf(mStream, _T("\"direction\": [%s],\n"), point(p));
	}
	else
		fprintf(mStream, _T("\"direction\": [%s],\n"), normPoint(dir));
	Indent(level+1);
	Point3 col = light->GetRGBColor(mStart, FOREVER);

	fprintf(mStream, _T("\"color\": %d\n"), col);
/*
	Indent(level+1);
	fprintf(mStream, _T("on %s\n"), ls.on ? _T("TRUE") : _T("FALSE"));
*/
	Indent(level);
	fprintf(mStream, _T("}"));
	return TRUE;
}

BOOL
WebGL2Export::WebGLOutSpotLight(INode* node, LightObject* light, int level, BOOL top)
{
	LightState ls;
	Interval iv = FOREVER;

	Point3 dir(0,0,-1);

	light->EvalLightState(mStart, iv, &ls);
	Indent(level);
	fprintf(mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("\"type\": \"spot\",\n"));
	Indent(level+1);
	fprintf(mStream, _T("\"intensity\": %s,\n"),
			floatVal(light->GetIntensity(mStart,FOREVER)));
	Indent(level+1);
	Point3 col = light->GetRGBColor(mStart, FOREVER);
	fprintf(mStream, _T("\"color\": [%s],\n"), color(col));
	Indent(level+1);
	if (top)
	{
		Point3 p = node->GetObjTMAfterWSM(mStart).GetTrans();
		fprintf(mStream, _T("\"position\": [%s],\n"), point(p));
	}
	else
		fprintf(mStream, _T("\"position\": [0, 0, 0],\n"));
	Indent(level+1);
	if (top)
	{
		Matrix3 tm = node->GetObjTMAfterWSM(mStart);
		Point3 p = Point3(0,0,-1);
		Point3 trans, s;
		Quat q;
		Matrix3 rot;
		AffineParts parts;
		decomp_affine(tm, &parts);
		q = parts.q;
		q.MakeMatrix(rot);
		p = p * rot;
		fprintf(mStream, _T("\"direction\": [%s],\n"), normPoint(p));
	}
	else
		fprintf(mStream, _T("\"direction\": [%s],\n"), normPoint(dir));
	Indent(level+1);
	fprintf(mStream, _T("\"cutOffAngle\": %s,\n"),
			floatVal(DegToRad(ls.fallsize)));
	Indent(level+1);
	fprintf(mStream, _T("\"beamWidth\": %s,\n"), floatVal(DegToRad(ls.hotsize)));
	Indent(level+1);
/*
	fprintf(mStream, _T("on %s\n"), ls.on ? _T("TRUE") : _T("FALSE"));
	Indent(level+1);
*/
	float radius;
	if (!ls.useAtten || ls.attenEnd == 0.0f)
		radius = Length(mBoundBox.Width());
	else
		radius = ls.attenEnd;
	fprintf(mStream, _T("\"radius\": %s\n"), floatVal(radius));
	if (ls.useAtten) {
		float attn;
		attn = (ls.attenStart <= 1.0f) ? 1.0f : 1.0f/ls.attenStart;
		Indent(1);
		fprintf(mStream, _T("\"attenuation\": [0 %s 0]\n"), floatVal(attn));
	}
	Indent(level);
	fprintf(mStream, _T("}"));
	return TRUE;
}

void
WebGL2Export::OutputTopLevelLight(INode* node, LightObject *light)
{
	Class_ID id = light->ClassID();
	if (id == Class_ID(OMNI_LIGHT_CLASS_ID, 0))
		WebGLOutPointLight(node, light, 1, TRUE);
	else if (id == Class_ID(DIR_LIGHT_CLASS_ID, 0) ||
			 id == Class_ID(TDIR_LIGHT_CLASS_ID, 0))
		WebGLOutDirectLight(node, light, 1, TRUE);
	else if (id == Class_ID(SPOT_LIGHT_CLASS_ID, 0) ||
			 id == Class_ID(FSPOT_LIGHT_CLASS_ID, 0))
		WebGLOutSpotLight(node, light, 1, TRUE);
	else
		return;
	
}

// Output a WebGL Inline node.
BOOL
WebGL2Export::WebGLOutInline(WebGLInsObject* obj, int level)
{
	return 0;
}

// Distance comparison function for sorting LOD lists.
static int
DistComp(LODObj** obj1, LODObj** obj2)
{
	float diff = (*obj1)->dist - (*obj2)->dist;
	if (diff < 0.0f) return -1;
	if (diff > 0.0f) return 1;
	return 0;
}

// Write out the WebGL for node we know about, including Opus nodes, 
// lights, cameras
BOOL
WebGL2Export::WebGLOutSpecial(INode* node, INode* parent,
							 Object* obj, int level, BOOL mirrored)
{
	Class_ID id = obj->ClassID();

	if (id == Class_ID(OMNI_LIGHT_CLASS_ID, 0))
		return WebGLOutPointLight(node, (LightObject*) obj, level+1, FALSE);

	if (id == Class_ID(DIR_LIGHT_CLASS_ID, 0) ||
		id == Class_ID(TDIR_LIGHT_CLASS_ID, 0))
		return WebGLOutDirectLight(node, (LightObject*) obj, level+1, FALSE);

	if (id == Class_ID(SPOT_LIGHT_CLASS_ID, 0) ||
		id == Class_ID(FSPOT_LIGHT_CLASS_ID, 0))
		return WebGLOutSpotLight(node, (LightObject*) obj, level+1, FALSE);

	if (id == Class_ID(WebGL_INS_CLASS_ID1, WebGL_INS_CLASS_ID2))
		return WebGLOutInline((WebGLInsObject*) obj, level+1);

	if (id == Class_ID(SIMPLE_CAM_CLASS_ID, 0) ||
		id == Class_ID(LOOKAT_CAM_CLASS_ID, 0))
		return WebGLOutCamera(node, obj, level+1);

	return FALSE;
		
}

static BOOL
IsLODObject(Object* obj)
{
	return obj->ClassID() == Class_ID(LOD_CLASS_ID1, LOD_CLASS_ID2);
}

static BOOL
IsEverAnimated(INode* node)
{
	if (!node)
		return FALSE;
	for (; !node->IsRootNode(); node = node->GetParentNode())
		if (node->IsAnimated())
			return TRUE;
	return FALSE;
}

BOOL
WebGL2Export::ChildIsAnimated(INode* node)
{
	if (node->IsAnimated())
		return TRUE;

	Object* obj = node->EvalWorldState(mStart).obj;

	if (ObjIsAnimated(obj))
		return TRUE;

	Class_ID id = node->GetTMController()->ClassID();

	if (id != Class_ID(PRS_CONTROL_CLASS_ID, 0))
		return TRUE;

	for (int i = 0; i < node->NumberOfChildren(); i++)
		if (ChildIsAnimated(node->GetChildNode(i)))
			return TRUE;
	return FALSE;
}

static BOOL
IsAnimTrigger(Object *obj)
{
	if (!obj)
		return FALSE;

	Class_ID id = obj->ClassID();
	return FALSE;
}

BOOL
WebGL2Export::isWebGLObject(INode * node, Object *obj, INode* parent)
{
	if (!obj)
		return FALSE;

	Class_ID id = obj->ClassID();

	if (id == Class_ID(WebGL_INS_CLASS_ID1, WebGL_INS_CLASS_ID2) ||
		id == SoundClassID ||
		id == ProxSensorClassID)
		return TRUE;

	// only animated lights come out in scene graph
	if (IsLight(node))
		return TRUE;
//        return (IsEverAnimated(node) || IsEverAnimated(node->GetTarget()));
	if (IsCamera(node))
		return TRUE;
//        return FALSE;

	if (node->NumberOfChildren() > 0)
		return TRUE;

#ifdef _LEC_
 // LEC uses dummies as place holders and need dummy leaves written.
	if (id == Class_ID(DUMMY_CLASS_ID, 0))
		return TRUE;
#endif

	return (obj->IsRenderable() ||
			id == Class_ID(LOD_CLASS_ID1, LOD_CLASS_ID2)) &&
		(mExportHidden || !node->IsHidden());
		
}

static BOOL
NodeIsChildOf(INode* child, INode* parent)
{
	if (child == parent)
		return TRUE;
 // skip invalid nodes (ex. user create the list then delete the node from the scene.)
	if (!parent)
		return FALSE;
	int num = parent->NumberOfChildren();
	int i;
	for (i = 0; i < num; i++) {
		if (NodeIsChildOf(child, parent->GetChildNode(i)))
			return TRUE;
	}
	return FALSE;
}

// For objects that change shape, output a CoodinateInterpolator
void
WebGL2Export::WebGLOutCoordinateInterpolator(INode* node, Object *obj,
										   int level, BOOL pMirror)
{
}

BOOL
WebGL2Export::ObjIsAnimated(Object *obj)
{
	if (!obj)
		return FALSE;
	Interval iv = obj->ObjectValidity(mStart);
	return !(iv == FOREVER);
}

static BOOL
MtlHasTexture(Mtl* mtl)
{
	if (mtl->ClassID() != Class_ID(DMTL_CLASS_ID, 0))
		return FALSE;

	StdMat* sm = (StdMat*) mtl;
	// Check for texture map
	Texmap* tm = (BitmapTex*) sm->GetSubTexmap(ID_DI);
	if (!tm)
		return FALSE;

	if (tm->ClassID() != Class_ID(BMTEX_CLASS_ID, 0))
		return FALSE;
	BitmapTex* bm = (BitmapTex*) tm;

	TSTR bitmapFile;

	bitmapFile = bm->GetMapName();
	if (bitmapFile.data() == NULL)
		return FALSE;
	int l = static_cast<int>(_tcslen(bitmapFile)-1);	// SR DCAST64: Downcast to 2G limit.
	if (l < 0)
		return FALSE;

	return TRUE;
}

static int
NumTextures(INode* node)
{
	float firstxpar = 0.0f;
	Mtl *sub, *mtl = node->GetMtl();
	if (!mtl)
		return 0;

	if (!mtl->IsMultiMtl())
		return 0;
	int num = mtl->NumSubMtls();
	for(int i = 0; i < num; i++) {
		sub = mtl->GetSubMtl(i);
		if (!sub)
			continue;
		if (MtlHasTexture(sub))
			return num;
		if (i == 0)
			firstxpar = sub->GetXParency();
		else if (sub->GetXParency() != firstxpar)
			return num;
	}
	return 0;
}

// Write the data for a single object.
// This function also takes care of identifying WebGL primitive objects
void
WebGL2Export::WebGLOutObject(INode* node, INode* parent, Object* obj, int level,
						   BOOL mirrored, ClassToFind targetClass, BOOL *isFirst)
{
 // need to get a valid obj ptr

	obj = node->EvalWorldState(mStart).obj;
	BOOL isTriMesh = obj->CanConvertToType(triObjectClassID);
	BOOL instance = FALSE;
	BOOL special = FALSE;
	Class_ID id;
	if (obj) id = obj->ClassID();

	if (targetClass == LIGHTS)
	{
		if (id == Class_ID(OMNI_LIGHT_CLASS_ID, 0))
		{
			StartNode (parent, level+1, isFirst);
			WebGLOutPointLight(node, (LightObject*) obj, level+1, FALSE);
		}
		else if (id == Class_ID(DIR_LIGHT_CLASS_ID, 0) ||
				id == Class_ID(TDIR_LIGHT_CLASS_ID, 0))
		{
			StartNode (parent, level+1, isFirst);
			WebGLOutDirectLight(node, (LightObject*) obj, level+1, FALSE);
		}
		else if (id == Class_ID(SPOT_LIGHT_CLASS_ID, 0) ||
				id == Class_ID(FSPOT_LIGHT_CLASS_ID, 0))
		{
			StartNode (parent, level+1, isFirst);
			WebGLOutSpotLight(node, (LightObject*) obj, level+1, FALSE);
		}
	}

//	else if (id == Class_ID(WebGL_INS_CLASS_ID1, WebGL_INS_CLASS_ID2))
//		WebGLOutInline((WebGLInsObject*) obj, level+1);

	else if (targetClass == CAMERAS)
	{
		if (id == Class_ID(SIMPLE_CAM_CLASS_ID, 0) || id == Class_ID(LOOKAT_CAM_CLASS_ID, 0))
		{
			StartNode (parent, level+1, isFirst);
			WebGLOutCamera(node, obj, level+1);
		}
	}
	else
	{

		int numTextures = NumTextures(node);
		int start, end;

		if (numTextures == 0) {
			start = -1;
			end = 0;
		}
		else
		{
			start = 0;
			end = numTextures;
		}
		if (targetClass == EMBEDS && isTriMesh && obj->IsRenderable())
		{
			Indent(level);
			fprintf(mStream, _T("\"%s_emb\": {\n"), mNodes.GetNodeName(node));
			Indent(level+1);
			fprintf(mStream, _T("\"materials\": [\n"), mNodes.GetNodeName(node));

			BOOL multiMat = FALSE;
			BOOL isWire = FALSE, twoSided = FALSE;
		
			BOOL isFirstMat = TRUE;
			for (int i = start; i < end; i++)
			{
				multiMat = OutputMaterial(node, isWire, twoSided, level+1, i, &isFirstMat, targetClass);
			}
			Indent(level+1);
			fprintf(mStream, _T("\"],\n"), mNodes.GetNodeName(node));

		}

		int old_level = level;
		BOOL isFirstMat = TRUE;
		for (int i = start; i < end; i++)
		{
			if ((targetClass == OBJECTS || targetClass == GEOMETRIES) && isTriMesh && obj->IsRenderable())
			{
				StartNode (parent, level+1, isFirst);
				if (targetClass == OBJECTS)
				{
					Indent(level);
					fprintf(mStream, _T("\"%s\": {\n"), mNodes.GetNodeName(node));
					OutputNodeTransform(node, level+1, mirrored);
					Indent(level+1);
					fprintf(mStream, _T("\"materials\": ["));
				}
				else if (targetClass == GEOMETRIES)
				{
					Indent(level);
					fprintf(mStream, _T("\"%s_geo\": {\n"), mNodes.GetNodeName(node));
					Indent(level+1);
					fprintf(mStream, _T("\"type\": \"embedded_mesh\",\n"));
					Indent(level+1);
					fprintf(mStream, _T("\"id\" : \"%s_emb\"\n"), mNodes.GetNodeName(node));
					Indent(level);
					fprintf(mStream, _T("}"), mNodes.GetNodeName(node));
				}
			}

			BOOL multiMat = FALSE;
			BOOL isWire = FALSE, twoSided = FALSE;
		
			// Output the material
			if ((targetClass == MATERIALS || targetClass == OBJECTS || targetClass == TEXTURES) && isTriMesh && obj->IsRenderable())  // if not trimesh, needs no matl
			{
				multiMat = OutputMaterial(node, isWire, twoSided, level+1, i, &isFirstMat, targetClass);
			}
			if ((targetClass == OBJECTS || targetClass == EMBEDS) && isTriMesh && obj->IsRenderable())
			{
				if (targetClass == OBJECTS)
				{
					Indent(level+1);
					fprintf(mStream, _T("],\n")); // end of 'materials' list for this object
				}
			// Output as a triangle mesh
				ObjectBucket* ob = mObjTable.AddObject(obj);
				if (targetClass == OBJECTS || (ob->objectUsed && i == -1))
				{
					instance = TRUE;
					// We have an instance
					//	StartNode (parent, level+1, isFirst);
					Indent(level+1);
					fprintf(mStream, _T("\"geometry\": \"%s_geo\",\n"),
						ob->objectUsed ? ob->instName.data() : mNodes.GetNodeName(node));
					Indent(level+1);
					fprintf(mStream, _T("\"visible\": true\n"));
				}
				else if (targetClass == EMBEDS)
				{
					StartNode (parent, level+1, isFirst);
					ob->objectUsed = TRUE;
					ob->instName = mNodes.GetNodeName(node);
					instance = FALSE;
					TriObject *tri = (TriObject *)obj->ConvertToType(mStart, triObjectClassID);
				
//					if (mPolygonType && !ObjIsAnimated(obj))
//							OutputPolygonObject(node, tri, multiMat, isWire, twoSided, level+1, i, mirrored);
//					else
						OutputTriObject(node, tri, multiMat, isWire, twoSided, level+1, i, mirrored);
				}
				if (targetClass == OBJECTS)
				{
					Indent(level);
					fprintf(mStream, _T("}"));
				}
			}
		}
	}
}

TCHAR*
WebGL2Export::WebGLParent(INode* node)
{
	static TCHAR buf[256];
	assert (node);
	_tcscpy(buf, mNodes.GetNodeName(node));
	return buf;
}

BOOL
WebGL2Export::IsAimTarget(INode* node)
{
	INode* lookAt = node->GetLookatNode();
	if (!lookAt)
		return FALSE;
	Object* lookAtObj = lookAt->EvalWorldState(mStart).obj;
	Class_ID id = lookAtObj->ClassID();
	// Only generate aim targets for targetted spot lights and cameras
	if (id != Class_ID(SPOT_LIGHT_CLASS_ID, 0) &&
		id != Class_ID(LOOKAT_CAM_CLASS_ID, 0))
		return FALSE;
	return TRUE;
}

void
WebGL2Export::AddCameraAnimRoutes(TCHAR* webglObjName, INode* fromNode,
								 INode* top)
{
}

void
WebGL2Export::AddAnimRoute(TCHAR* from, TCHAR* to, INode* fromNode,
						  INode* toNode  )
{
}

int
WebGL2Export::NodeNeedsTimeSensor(INode* node)
{
	return -1;
}

void
WebGL2Export::WriteAnimRoutes()
{
}

void
WebGL2Export::InitInterpolators(INode* node)
{
}

void
WebGL2Export::AddInterpolator(TCHAR* interp, int type, TCHAR* name)
{
}

void
WebGL2Export::WriteInterpolatorRoutes(int level, BOOL isCamera)
{
}

inline BOOL
ApproxEqual(float a, float b, float eps)
{
	float d = (float) fabs(a-b);
	return d < eps;
}

int
reducePoint3Keys(Tab<TimeValue>& times, Tab<Point3>& points, float eps)
{
	if (times.Count() < 3)
		return times.Count();

	BOOL *used = new BOOL[times.Count()];
	int i;
	for(i = 0; i < times.Count(); i++)
		used[i] = TRUE;

	// The two lines are represented as p0 + v * s and q0 + w * t.
	Point3 p0, q0;  
	for(i = 1; i < times.Count(); i++) {
		p0 = points[i];
		q0 = points[i-1];
		if (ApproxEqual(p0.x, q0.x, eps) && 
			ApproxEqual(p0.y, q0.y, eps) && 
			ApproxEqual(p0.z, q0.z, eps)) 
			used[i] = FALSE;
		else {
			used[i-1] = TRUE;
		}
	}

	int j = 0;
	for(i = 0; i<times.Count(); i++)
		if (used[i])
			j++;
	if (j == 1) {
		delete[] used;
		return 0;
	}
	j = 0;
	for(i = 0; i < times.Count(); i++) {
		if (used[i]) {
			times[j] = times[i];
			points[j] = points[i];
			j++;
		}
	}
	times.SetCount(j);
	points.SetCount(j);
	delete[] used;
	if (j == 1)
		return 0;
	if (j == 2) {
		p0 = points[0];
		q0 = points[1];
		if (ApproxEqual(p0.x, q0.x, eps) && 
			ApproxEqual(p0.y, q0.y, eps) && 
			ApproxEqual(p0.z, q0.z, eps)) 
			return 0;
	}
	return j;
}

int
reduceAngAxisKeys(Tab<TimeValue>& times, Tab<AngAxis>& points, float eps)
{
	if (times.Count() < 3)
		return times.Count();

	BOOL *used = new BOOL[times.Count()];
	int i;
	for(i = 0; i < times.Count(); i++)
		used[i] = TRUE;

	// The two lines are represented as p0 + v * s and q0 + w * t.
	AngAxis p0, q0;  
	for(i = 1; i < times.Count(); i++) {
		p0 = points[i];
		q0 = points[i-1];
		if (ApproxEqual(p0.axis.x, q0.axis.x, eps) && 
			ApproxEqual(p0.axis.y, q0.axis.y, eps) && 
			ApproxEqual(p0.axis.z, q0.axis.z, eps) && 
			ApproxEqual(p0.angle, q0.angle, eps)) 
			used[i] = FALSE;
		else {
			used[i-1] = TRUE;
		}
	}

	int j = 0;
	for(i = 0; i<times.Count(); i++)
		if (used[i])
			j++;
	if (j == 1) {
		delete[] used;
		return 0;
	}
	j = 0;
	for(i = 0; i < times.Count(); i++) {
		if (used[i]) {
			times[j] = times[i];
			points[j] = points[i];
			j++;
		}
	}
	times.SetCount(j);
	points.SetCount(j);
	delete[] used;
	if (j == 1)
		return 0;
	if (j == 2) {
		p0 = points[0];
		q0 = points[1];
		if (ApproxEqual(p0.axis.x, q0.axis.x, eps) && 
			ApproxEqual(p0.axis.y, q0.axis.y, eps) && 
			ApproxEqual(p0.axis.z, q0.axis.z, eps) && 
			ApproxEqual(p0.angle, q0.angle, eps)) 
			return 0;
	}
	return j;
}

int
reduceScaleValueKeys(Tab<TimeValue>& times, Tab<ScaleValue>& svs, float eps)
{
	if (times.Count() < 3)
		return times.Count();

	BOOL *used = new BOOL[times.Count()];
	BOOL alliso = (ApproxEqual(svs[0].s.x, svs[0].s.y, eps) &&
				   ApproxEqual(svs[0].s.x, svs[0].s.z, eps));
	int i;
	for (i = 0; i < times.Count(); i++)
		used[i] = TRUE;

	Point3 s0, t0;
	AngAxis p0, q0;
	for (i = 1; i < times.Count(); i++) {
		s0 = svs[i].s;
		t0 = svs[i-1].s;
		if (ApproxEqual(s0.x, t0.x, eps) &&
			ApproxEqual(s0.y, t0.y, eps) &&
			ApproxEqual(s0.z, t0.z, eps)) {
			AngAxisFromQa(svs[i].q, &p0.angle, p0.axis);
			AngAxisFromQa(svs[i-1].q, &q0.angle, q0.axis);
			if (ApproxEqual(p0.axis.x, q0.axis.x, eps) && 
				ApproxEqual(p0.axis.y, q0.axis.y, eps) && 
				ApproxEqual(p0.axis.z, q0.axis.z, eps) && 
				ApproxEqual(p0.angle, q0.angle, eps)) 
				used[i] = FALSE;
			else
				used[i-1] = TRUE;
		}
		else {
			used[i-1] = TRUE;
			alliso = FALSE;
		}
	}

	if (alliso) {       // scale always isotropic and constant
		delete [] used;
		return 0;
	}

	int j = 0;
	for (i = 0; i < times.Count(); i++)
		if (used[i])
			j++;
	if (j == 1) {
		delete [] used;
		return 0;
	}
	j = 0;
	for (i = 0; i < times.Count(); i++) {
		if (used[i]) {
			times[j] = times[i];
			svs[j] = svs[i];
			j++;
		}
	}
	times.SetCount(j);
	svs.SetCount(j);
	delete [] used;
	if (j == 1)
		return 0;
	if (j == 2) {
		s0 = svs[0].s;
		t0 = svs[1].s;
		AngAxisFromQa(svs[0].q, &p0.angle, p0.axis);
		AngAxisFromQa(svs[1].q, &q0.angle, q0.axis);
		if (ApproxEqual(s0.x, t0.x, eps) && 
			ApproxEqual(s0.y, t0.y, eps) && 
			ApproxEqual(s0.z, t0.z, eps) && 
			ApproxEqual(p0.axis.x, q0.axis.x, eps) && 
			ApproxEqual(p0.axis.y, q0.axis.y, eps) && 
			ApproxEqual(p0.axis.z, q0.axis.z, eps) && 
			ApproxEqual(p0.angle, q0.angle, eps)) 
			return 0;
	}
	return j;
}

// Write out all the keyframe data for the given controller
void
WebGL2Export::WriteControllerData(INode* node,
								 Tab<TimeValue>& posTimes,
								 Tab<Point3>& posKeys,
								 Tab<TimeValue>& rotTimes,
								 Tab<AngAxis>& rotKeys,
								 Tab<TimeValue>& sclTimes,
								 Tab<ScaleValue>& sclKeys,
								 int type, int level)
{
}

void
WebGL2Export::WriteAllControllerData(INode* node, int flags, int level,
									Control* lc)
{
}
	
void
WebGL2Export::WriteVisibilityData(INode *node, int level) {
	int i;
	TimeValue t;
	int frames = mIp->GetAnimRange().End()/GetTicksPerFrame();
	BOOL lastVis = TRUE, vis;

	// Now generate the Hide keys
	for(i = 0, t = mStart; i <= frames; i++, t += GetTicksPerFrame()) {
	vis = node->GetVisibility(t) <= 0.0f ? FALSE : TRUE;
		if (vis != lastVis) {
			mHadAnim = TRUE;
			Indent(level);
			fprintf(mStream, _T("HideKey_ktx_com {\n"));
			if (mGenFields) {
				Indent(level+1);
				fprintf(mStream, _T("fields [ SFLong frame] \n"));
			}
			Indent(level+1);
			fprintf(mStream, _T("frame %d\n"), i);
			Indent(level);
			fprintf(mStream, _T("}\n"));
		}
		lastVis = vis;
	}    
}

BOOL
WebGL2Export::IsLight(INode* node)
{
	Object* obj = node->EvalWorldState(mStart).obj;
	if (!obj)
		return FALSE;

	SClass_ID sid = obj->SuperClassID();
	return sid == LIGHT_CLASS_ID;
}

BOOL
WebGL2Export::IsCamera(INode* node)
{
	Object* obj = node->EvalWorldState(mStart).obj;
	if (!obj)
		return FALSE;

	SClass_ID sid = obj->SuperClassID();
	return sid == CAMERA_CLASS_ID;
}

BOOL
WebGL2Export::IsAudio(INode* node)
{
	Object* obj = node->EvalWorldState(mStart).obj;
	if (!obj)
		return FALSE;

	Class_ID cid = obj->ClassID();
	return cid == AudioClipClassID;
}

static Control* GetController(Object* obj, const TCHAR* name)
{
	Control* c = NULL;
	if (obj != NULL) {
		init_thread_locals();
		push_alloc_frame();
		one_value_local(prop);			// Keep one local variables
		save_current_frames();
		set_error_trace_back_active( FALSE );

		try {
			ParamDimension* dim;

			// Get the name and value to set
			vl.prop = Name::intern(const_cast<TCHAR*>(name));

			// Get the value.
			c = MAXWrapper::get_max_prop_controller(obj, vl.prop, &dim);
		} catch ( ... ) {
			clear_error_source_data();
			restore_current_frames();
			MAXScript_signals = 0;
			if (progress_bar_up)
				MAXScript_interface->ProgressEnd(), progress_bar_up = FALSE;
		}
		pop_value_locals();
		pop_alloc_frame();
	}
	return c;
}

Control *
WebGL2Export::GetLightColorControl(INode* node)
{
	if (!IsLight(node))
		return NULL;
	Object* obj = node->EvalWorldState(mStart).obj;
	// MaxScript is more reliable for getting controllers
	return GetController(obj, "rgb");
//    IParamBlock *pblock = (IParamBlock *) obj->SubAnim(0);
//    Control* cont = pblock->GetController(0);  // I know color is index 0!
//    return cont;
}

#define NeedsKeys(nkeys) ((nkeys) > 1 || (nkeys) == NOT_KEYFRAMEABLE)

// Write out keyframe data, if it exists
void
WebGL2Export::WebGLOutControllers(INode* node, int level)
{

#ifdef _LEC_
	if (mFlipBook)
		return;
#endif
	Control *pc, *rc, *sc, *lc;
	int npk = 0, nrk = 0, nsk = 0, nvk = 0, nlk = 0;

	int flags = 0;
	BOOL isCamera = IsCamera(node);
	Object *obj = node->EvalWorldState(mStart).obj;
	int ts = NodeNeedsTimeSensor(node);

	if (ts != 0) {
		mCycleInterval = (mIp->GetAnimRange().End() - mStart) /
			((float) GetTicksPerFrame()* GetFrameRate());
		Indent(level);
		fprintf(mStream,
		 _T("DEF %s-TIMER TimeSensor { loop %s cycleInterval %s },\n"),
				mNodes.GetNodeName(node),
				(ts < 0) ? _T("TRUE") : _T("FALSE"),
				floatVal(mCycleInterval));
	}

	lc = GetLightColorControl(node);
	if (lc) nlk = lc->NumKeys();
	if (NeedsKeys(nlk))
		WriteAllControllerData(node, KEY_COLOR, level, lc);

	Class_ID id = node->GetTMController()->ClassID();

	if (!node->IsAnimated() && id == Class_ID(PRS_CONTROL_CLASS_ID, 0) &&
			!isCamera && !IsLight(node))
		return;

#ifdef _DEBUG
	int inhf = node->GetTMController()->GetInheritanceFlags();
	int inhb = node->GetTMController()->InheritsParentTransform();
#endif
	
	if (!isCamera && id != Class_ID(PRS_CONTROL_CLASS_ID, 0))
		flags = KEY_POS | KEY_ROT | KEY_SCL;
	else if (isCamera && (IsEverAnimated(node) ||
						  IsEverAnimated(node->GetTarget())))
		flags = KEY_POS | KEY_ROT;
	else {
		pc = node->GetTMController()->GetPositionController();
		if (pc) npk = pc->NumKeys();
		rc = node->GetTMController()->GetRotationController();
		if (rc) nrk = rc->NumKeys();
		sc = node->GetTMController()->GetScaleController();
		if (sc) nsk = sc->NumKeys();
		if (NeedsKeys(npk) || NeedsKeys(nrk) || NeedsKeys(nsk))
			flags = KEY_POS | KEY_ROT | KEY_SCL;
	}
	if (flags)
		WriteAllControllerData(node, flags, level, NULL);
#if 0
	Control* vc = node->GetVisController();
	if (vc) nvk = vc->NumKeys();
	if (NeedsKeys(nvk))
		WriteVisibilityData(node, level);
#endif
}

void
WebGL2Export::WebGLOutTopLevelCamera(int level, INode* node, BOOL topLevel)
{
//	if (!topLevel && node == mCamera)
//		return;
		
	CameraObject* cam = (CameraObject*) node->EvalWorldState(mStart).obj;
	Matrix3 tm = node->GetObjTMAfterWSM(mStart);
	Point3 p, s, axis;
	Quat q;
	float ang;

	AffineParts parts;
	decomp_affine(tm, &parts);
	p = parts.t;
	q = parts.q;
	if (!mZUp) {
		// Now rotate around the X Axis PI/2
		Matrix3 rot = RotateXMatrix(PI/2);
		Quat qRot(rot);
		AngAxisFromQa(q/qRot, &ang, axis);
	} else
		AngAxisFromQa(q, &ang, axis);

	// compute camera transform
	ViewParams vp;
	CameraState cs;
	Interval iv;
	cam->EvalCameraState(0, iv, &cs);
	vp.fov = (float)(2.0 * atan(tan(cs.fov / 2.0) / INTENDED_ASPECT_RATIO));
	/*
	Indent(level);
	fprintf(mStream, _T("DEF %s Viewpoint {\n"), mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("position %s\n"), point(p));
	Indent(level+1);
	fprintf(mStream, _T("orientation %s\n"), axisPoint(axis, -ang));
	Indent(level+1);
	fprintf(mStream, _T("fieldOfView %s\n"), floatVal(vp.fov));
	Indent(level + 1);
	fprintf(mStream, _T("description \"%s\"\n"), mNodes.GetNodeName(node));
	Indent(level);
	fprintf(mStream, _T("}\n"));

	// Write out any animation data
	InitInterpolators(node);
	WebGLOutControllers(node, 0);
	WriteInterpolatorRoutes(level, TRUE);
	*/
	// cameras go here
}

// In navinfo.cpp
extern TCHAR* navTypes[];

void
WebGL2Export::WebGLOutTopLevelNavInfo(int level, INode* node, BOOL topLevel)
{
	if (!topLevel && node == mNavInfo)
		return;

	NavInfoObject* ni = (NavInfoObject*) node->EvalWorldState(mStart).obj;
	int type, headlight;
	float visLimit, speed, collision, terrain, step;
	ni->pblock->GetValue(PB_TYPE, mIp->GetTime(), type, FOREVER);
	ni->pblock->GetValue(PB_HEADLIGHT, mIp->GetTime(), headlight, FOREVER);
	ni->pblock->GetValue(PB_VIS_LIMIT, mIp->GetTime(), visLimit, FOREVER);
	ni->pblock->GetValue(PB_SPEED, mIp->GetTime(), speed, FOREVER);
	ni->pblock->GetValue(PB_COLLISION, mIp->GetTime(), collision, FOREVER);
	ni->pblock->GetValue(PB_TERRAIN, mIp->GetTime(), terrain, FOREVER);
	ni->pblock->GetValue(PB_STEP, mIp->GetTime(), step, FOREVER);
	Indent(level);
	fprintf(mStream, _T("DEF %s NavigationInfo {\n"),mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("avatarSize [%s, "), floatVal(collision));
	fprintf(mStream, _T("%s, "), floatVal(terrain));
	fprintf(mStream, _T("%s]\n"), floatVal(step));
	Indent(level+1);
	fprintf(mStream, _T("headlight %s\n"),
			headlight ? _T("TRUE") : _T("FALSE"));
	Indent(level+1);
	fprintf(mStream, _T("speed %s\n"), floatVal(speed));
	Indent(level+1);
	if (type < 0 || type > 3)
		type = 0;
	fprintf(mStream, _T("type \"%s\"\n"), navTypes[type]);
	Indent(level+1);
	fprintf(mStream, _T("visibilityLimit %s\n"), floatVal(visLimit));
	Indent(level);
	fprintf(mStream, _T("}\n"));
}

void
WebGL2Export::WebGLOutTopLevelBackground(int level, INode* node, BOOL topLevel)
{
}

void
WebGL2Export::WebGLOutTopLevelFog(int level, INode* node, BOOL topLevel)
{
	if (!topLevel && node == mFog)
		return;

	FogObject* fog = (FogObject*) node->EvalWorldState(mStart).obj;
	Point3 p;
	float visLimit;
	int type;
	fog->pblock->GetValue(PB_COLOR, mIp->GetTime(), p, FOREVER);
	fog->pblock->GetValue(PB_TYPE, mIp->GetTime(), type, FOREVER);
	fog->pblock->GetValue(PB_VIS_LIMIT, mIp->GetTime(), visLimit, FOREVER);
	Indent(level);
	fprintf(mStream, _T("DEF %s Fog {\n"), mNodes.GetNodeName(node));
	Indent(level+1);
	fprintf(mStream, _T("color %s\n"), color(p));
	Indent(level+1);
	fprintf(mStream, _T("fogType \"%s\"\n"), type == 0 ? _T("LINEAR") :
			_T("EXPONENTIAL"));
	Indent(level+1);
	fprintf(mStream, _T("visibilityRange %s\n"), floatVal(visLimit));
	Indent(level);
	fprintf(mStream, _T("}\n"));
}

void
WebGL2Export::WebGLOutInitializeAudioClip(int level, INode* node)
{
}

void
WebGL2Export::WebGLOutAudioClip(int level, INode* node)
{
}

// From dllmain.cpp
extern HINSTANCE hInstance;

void
WebGL2Export::WebGLOutFileInfo()
{
	char filename[MAX_PATH];
	DWORD size, dummy;
	float vernum = 2.0f;
	float betanum = 0.0f;

	GetModuleFileName(hInstance, filename, MAX_PATH);
	size = GetFileVersionInfoSize(filename, &dummy);
	if (size)
	{
		char *buf = (char *)malloc(size);
		GetFileVersionInfo(filename, NULL, size, buf);
		VS_FIXEDFILEINFO *qbuf;
		UINT len;
		if (VerQueryValue(buf, "\\", (void **)&qbuf, &len))
		{
			// got the version information
			DWORD ms = qbuf->dwProductVersionMS;
			DWORD ls = qbuf->dwProductVersionLS;
			vernum = HIWORD(ms) + (LOWORD(ms) / 100.0f);
			betanum = HIWORD(ls) + (LOWORD(ls) / 100.0f);
		}
		free(buf);
	}
	fprintf (mStream, _T("\"metadata\": {\n"));
	Indent (1);
	fprintf (mStream, _T("\"formatVersion\": 3,\n"));
	Indent (1);
	fprintf (mStream, _T("\"type\": \"scene\",\n"));
	Indent (1);
	TCHAR* fn = mIp->GetCurFileName();
	fprintf (mStream, _T("\"sourceFile\": \"%s\",\n"), fn);
	Indent (1);
	fprintf(mStream, _T("\"generatedBy\" : \"3D Studio MAX WebGL exporter, Version %.5g, Revision %.5g\""),
		vernum, betanum);
	fprintf (mStream, _T("\n},\n"));

/*	
	time_t ltime;
	time( &ltime );
	char * time = ctime(&ltime);
	// strip the CR
	time[strlen(time)-1] = '\0';
	if (fn && _tcslen(fn) > 0) {
		fprintf(mStream, _T("// MAX File: %s, Date: %s\n\n"), fn, time);
	} else {
		fprintf(mStream, _T("// Date: %s\n\n"), time);
	}
*/
}

void
WebGL2Export::WebGLOutWorldInfo()
{
	if (mTitle.Length() == 0 && mInfo.Length() == 0)
		return;

	fprintf(mStream, _T("\"metadata\":\n"));
	Indent(1);
	fprintf(mStream, _T("{\n"));
	if (mTitle.Length() != 0)
	{
		Indent(2);
		fprintf(mStream, _T("\"sourceFile\"    : \"%s\""), mTitle.data());
//		fprintf(mStream, _T("title \"%s\"\n"), mTitle.data());
	}
	/*
	if (mInfo.Length() != 0)
	{
		Indent(1);
		fprintf(mStream, _T("info \"%s\"\n"), mInfo.data());
	}
	*/
	Indent(1);
	fprintf(mStream, _T("}\n"));
}

int
WebGL2Export::StartAnchor(INode* node, int& level)
{
	SensorBucket *sb = mSensorTable.FindSensor(node);
	if (!sb)
		return 0;
	INode *sensor;
	INodeList *l;
	int numAnchors = 0;
	for(l = sb->mSensors; l; l = l->GetNext()) {
		sensor = l->GetNode();
		Object *obj = sensor->EvalWorldState(mStart).obj;
		assert(obj);
		if (obj->ClassID() == AnchorClassID) {
			numAnchors++;
			AnchorObject* ao = (AnchorObject*)
				sensor->EvalWorldState(mStart).obj;
			Indent(level);
			fprintf(mStream, _T("Anchor {\n"));
			level++;
			Indent(level);
			fprintf(mStream, _T("description \"%s\"\n"), ao->description.data());
			int type;
			ao->pblock->GetValue(PB_AN_TYPE, mStart, type, FOREVER);
			if (type == 0) {
				Indent(level);
				fprintf(mStream, _T("parameter \"%s\"\n"), ao->parameter.data());
				Indent(level);
				fprintf(mStream, _T("url \"%s\"\n"), ao->URL.data());
			} else {
				if (ao->cameraObject) {
					Indent(level);
					fprintf(mStream, _T("url \"#%s\"\n"),
							WebGLName(ao->cameraObject->GetName()));
				}
			}
			Indent(level);
			fprintf(mStream, _T("children [\n"));
			level++;
		}
	}
	return numAnchors;
}

// Recursively count a node and all its children
static int
CountNodes(INode *node)
{
	int total, kids, i;
	
	if (node == NULL)
		return 0;
	total = 1;
	kids = node->NumberOfChildren();
	for (i = 0; i < kids; i++)
		total += CountNodes(node->GetChildNode(i));
	return total;
}

// Output a single node as WebGL and recursively output the children of
// the node.
void
WebGL2Export::WebGLOutNode(INode* node, INode* parent, int level, BOOL isLOD,
						 BOOL lastChild, BOOL mirrored, ClassToFind targetClass, BOOL *isFirst)
{
 // Don't gen code for LOD references, only LOD nodes
	if (!isLOD && ObjectIsLODRef(node))
		return;
	
	if (mEnableProgressBar)
		SendMessage(hWndPDlg, 666, 0, (LPARAM) mNodes.GetNodeName(node));
	
	Object* obj         = node->EvalWorldState(mStart).obj;
	Class_ID id;
	if (obj) id = obj->ClassID();
	BOOL    outputName  = TRUE;
	int     numChildren = node->NumberOfChildren();
	BOOL    isWebGL      = isWebGLObject(node, obj, parent);
	BOOL    numAnchors  = 0;
	BOOL    written     = FALSE;
	BOOL    mirror      = FALSE;
	int     cnt;

	// give third party dlls a chance to write the node
	if (!node->IsRootNode())
	{
		written = FALSE;
		for (cnt = 0; cnt < mCallbacks->GetPreNodeCount(); cnt++)
		{
			DllPreNode preNode = mCallbacks->GetPreNode(cnt);
			PreNodeParam params;
			params.version  = 0;
			params.indent   = level;
			params.fName    = mFilename;
			params.i        = mIp;
			params.node     = node;

			if (mStream)
				fclose(mStream), mStream = NULL;
			written = (*(preNode))(&params);
			if (written)
				break; // only the first one gets to write the node
		}
		if (!mStream)
			mStream = _tfopen(mFilename, _T("a"));
	}

	if (isWebGL && !written)
	{
//		if (targetClass == OBJECTS && !IsLODObject(obj))
//			mirror = OutputNodeTransform(node, level+1, mirrored);

	 // Output the data for the object at this node
//        Indent(level+1);
//        fprintf(mStream, _T("children? [\n"));
	}
	if ((isWebGL && (mExportHidden || !node->IsHidden()) && !written) || IsAnimTrigger(obj))
	{
		WebGLOutObject(node, parent, obj, level+2, mirrored ^ mirror, targetClass, isFirst);
	}
	
	if (mEnableProgressBar) SendMessage(hWndPB, PBM_STEPIT, 0, 0);

	// Now output the children
	if (!(written & WroteNodeChildren))
	{
		for (int i = 0; i < numChildren; i++)
		{
			WebGLOutNode(node->GetChildNode(i), node, level+2, FALSE,
				i == numChildren - 1, mirrored ^ mirror, targetClass, isFirst);
		}
	}
/*
 // need to get a valid obj ptr WebGLOutNode (WebGLOutCoordinateInterpolator)
 // causes the obj ptr (cache) to be invalid
	obj = node->EvalWorldState(mStart).obj;

	if (obj && (obj->ClassID() == BillboardClassID) && (numChildren > 0) && !written) {
		Indent(level+1);
		fprintf(mStream, _T("] }\n"));
	}

	if (!node->IsRootNode() && isWebGL && !written) {
		OutputTouchSensors(node, level);
		Indent(level+1);
		fprintf(mStream, _T("]\n"));
	}

	if (!node->IsRootNode() && !written) {
		if (node->GetParentNode()->IsRootNode())
			WriteInterpolatorRoutes(level, FALSE);  // must be in place of field
	}
	*/
//	if (isWebGL && !node->IsRootNode() && !written)
//		EndNode(node, obj, level, lastChild);
 
 // give third party dlls a chance to finish up the node
	if (!node->IsRootNode())
	{
		for (cnt = 0; cnt < mCallbacks->GetPostNodeCount(); cnt++)
		{
			DllPostNode postNode = mCallbacks->GetPostNode(cnt);
			PostNodeParam params;
			params.version  = 0;
			params.indent   = level;
			params.fName    = mFilename;
			params.i        = mIp;
			params.node     = node;

			if (mStream)
				fclose(mStream), mStream = NULL;

			(*(postNode))(&params);
		}
		if (!mStream)
			mStream = _tfopen(mFilename, _T("a"));
	}
}

// Traverse the scene graph looking for LOD nodes and texture maps.
// Mark nodes affected by sensors (time, touch, proximity).
void
WebGL2Export::TraverseNode(INode* node, ClassToFind targetClass)
{
}

void
WebGL2Export::ComputeWorldBoundBox(INode* node, ViewExp* vpt)
{
	if (!node) return;
	Object* obj = node->EvalWorldState(mStart).obj;
	Class_ID id;

	node->SetNodeLong(0);
	if (obj) {
		id = obj->ClassID();
		Box3 bb;
		obj->GetWorldBoundBox(mStart, node, vpt, bb);
		mBoundBox += bb;
	}

	int n = node->NumberOfChildren();
	for(int i = 0; i < n; i++)
		ComputeWorldBoundBox(node->GetChildNode(i), vpt);
}

// Compute the world bounding box and a list of timesensors;
// also initialize each INode's nodeLong data
void
WebGL2Export::ScanSceneGraph1()
{
	ViewExp *vpt = mIp->GetViewport(NULL);
	INode* node = mIp->GetRootNode();
	ComputeWorldBoundBox(node, vpt);
}

// Make a list of al the LOD objects and texture maps in the scene.
// Also output top-level objects
void
WebGL2Export::ScanSceneGraph2()
{
}

// Return TRUE iff the node is referenced by the LOD node.
static BOOL
ObjectIsReferenced(INode* lodNode, INode* node)
{
	Object* obj = lodNode->GetObjectRef();
	int numRefs = obj->NumRefs();

	for(int i=0; i < numRefs; i++)
		if (node == (INode*) obj->GetReference(i))
			return TRUE;

	return FALSE;
}

// Return TRUE iff the node is referenced by ANY LOD node.
BOOL 
WebGL2Export::ObjectIsLODRef(INode* node)
{
	INodeList* l = mLodList;

	for(; l; l = l->GetNext())
		if (ObjectIsReferenced(l->GetNode(), node))
			return TRUE;

	return FALSE;
}


extern HINSTANCE hInstance;

static INT_PTR CALLBACK
ProgressDlgProc(HWND hDlg, UINT msg, WPARAM wParam, LPARAM lParam) 
{
	switch (msg)
	{
		case WM_INITDIALOG:
			CenterWindow(hDlg, GetParent(hDlg));
			Static_SetText(GetDlgItem(hDlg, IDC_PROGRESS_NNAME), " ");
			return TRUE;
		case WM_COMMAND:
			switch(LOWORD(wParam))
			{
				case IDCANCEL:
					DestroyWindow(hDlg);
					hDlg = NULL;
					return TRUE;
				case IDOK:
					DestroyWindow(hDlg);
					hDlg = NULL;
					return TRUE;
			}
			return FALSE;
		case 666:
			Static_SetText(GetDlgItem(hDlg, IDC_PROGRESS_NNAME), (TCHAR *) lParam);
			return TRUE;
	}
	return FALSE;
}


// Export the current scene as WebGL
int
WebGL2Export::DoExport(const TCHAR* filename, Interface* i, WebGLExport* exp)
{
	mIp = i;
	mStart = mIp->GetAnimRange().Start();

	mGenNormals      = exp->GetGenNormals();
	mIndent          = exp->GetIndent();
	mType            = exp->GetExportType();
	mUsePrefix       = exp->GetUsePrefix();
	mUrlPrefix       = exp->GetUrlPrefix();
	mCamera          = exp->GetCamera();
	mZUp             = exp->GetZUp();
	mDigits          = exp->GetDigits();
	mCoordInterp     = exp->GetCoordInterp();
	mTformSample     = exp->GetTformSample();
	mTformSampleRate = exp->GetTformSampleRate();
	mCoordSample     = exp->GetCoordSample();
	mCoordSampleRate = exp->GetCoordSampleRate();
	mNavInfo         = exp->GetNavInfo();
	mBackground      = exp->GetBackground();
	mFog             = exp->GetFog();
	mTitle           = exp->GetTitle();
	mInfo            = exp->GetInfo();
	mExportHidden    = exp->GetExportHidden();
	mPrimitives      = exp->GetPrimitives();
	mPolygonType     = exp->GetPolygonType();
	mEnableProgressBar    = exp->GetEnableProgressBar();
	mPreLight        = exp->GetPreLight();
	mCPVSource       = exp->GetCPVSource();
	mCallbacks       = exp->GetCallbacks();
	mFilename        = (TCHAR*) filename;
	
	WorkFile theFile(mFilename, _T("w"));
	mStream = theFile.MStream();

	if (!mStream)
	{
		TCHAR msg[MAX_PATH];
		TCHAR title[MAX_PATH];
		LoadString(hInstance, IDS_OPEN_FAILED, msg, MAX_PATH);
		LoadString(hInstance, IDS_WEBGL_EXPORT, title, MAX_PATH);
		MessageBox(GetActiveWindow(), msg, title, MB_OK);
		return TRUE;
	}

	HCURSOR busy = LoadCursor(NULL, IDC_WAIT);
	HCURSOR normal = LoadCursor(NULL, IDC_ARROW);
	SetCursor(busy);

 // Write out the WebGL header and file info
	fprintf(mStream, _T("{\n"));
	WebGLOutFileInfo();

 // generate the hash table of unique node names
	GenerateUniqueNodeNames(mIp->GetRootNode());

	if (mEnableProgressBar)
	{
		RECT rcClient;  // client area of parent window 
		int cyVScroll;  // height of a scroll bar arrow 
		hWndPDlg = CreateDialog(hInstance, MAKEINTRESOURCE(IDD_PROGRESSDLG),
					GetActiveWindow(), ProgressDlgProc);
		GetClientRect(hWndPDlg, &rcClient); 
		cyVScroll = GetSystemMetrics(SM_CYVSCROLL); 
		ShowWindow(hWndPDlg, SW_SHOW);
	 // InitCommonControls(); 
		hWndPB = CreateWindow(PROGRESS_CLASS, (LPSTR) NULL, 
			WS_CHILD | WS_VISIBLE, rcClient.left, 
			rcClient.bottom - cyVScroll, 
			rcClient.right, cyVScroll, 
			hWndPDlg, (HMENU) 0, hInstance, NULL); 
	// Set the range and increment of the progress bar. 
		SendMessage(hWndPB, PBM_SETRANGE, 0, MAKELPARAM(0,
			CountNodes(mIp->GetRootNode()) + 1));
		SendMessage(hWndPB, PBM_SETSTEP, (WPARAM) 1, 0); 
	}
 
 // give third party dlls a chance to write before the scene was written
	BOOL written = FALSE;
	int cnt;
	for (cnt = 0; cnt < mCallbacks->GetPreSceneCount(); cnt++)
	{
		DllPreScene preScene = mCallbacks->GetPreScene(cnt);
		PreSceneParam params;
		params.version = 0;
		params.fName   = mFilename;
		params.i       = mIp;
		if (mStream)
			fclose(mStream), mStream = NULL;
		written = (*(preScene))(&params);   //third party wrote the scene
		if (written)
			break; // first come first served
	}
	if (!mStream)
		mStream = _tfopen(mFilename, _T("a"));
	 
 // Write out the scene graph
	if (!written)
	{
		BOOL isFirst = TRUE;
		fprintf(mStream, _T("\"lights\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, LIGHTS, &isFirst);
		fprintf(mStream, _T("\n},\n\n"));

		isFirst = TRUE;
		fprintf(mStream, _T("\"cameras\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, CAMERAS, &isFirst);
		fprintf(mStream, _T("\n},\n\n"));

		isFirst = TRUE;
		fprintf(mStream, _T("\"materials\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, MATERIALS, &isFirst);
		fprintf(mStream, _T("\n},\n\n"));

		isFirst = TRUE;
		fprintf(mStream, _T("\"objects\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, OBJECTS, &isFirst);
		fprintf(mStream, _T("\n},\n\n"));

		isFirst = TRUE;
		fprintf(mStream, _T("\"textures\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, TEXTURES, &isFirst);
		fprintf(mStream, _T("\n},\n\n"));

		isFirst = TRUE;
		fprintf(mStream, _T("\n\"geometries\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, GEOMETRIES, &isFirst);
		fprintf(mStream, _T("\n},\n\n"));

		isFirst = TRUE;
		fprintf(mStream, _T("\n\"embeds\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, EMBEDS, &isFirst);
		fprintf(mStream, _T("\n}\n"));
		isFirst = TRUE;

		fprintf(mStream, _T("\n\"defaults\":\n{\n"));
		WebGLOutNode(mIp->GetRootNode(), NULL, -2, FALSE, TRUE, FALSE, DEFAULTS, &isFirst);
		if (mCamera)
		{
			Indent(1);
			fprintf (mStream, _T("\"camera\" : \"%s\",\n"), mCamera->GetName());
		}
		Indent(1);
		fprintf (mStream, _T("\"bgColor\" : [0,0,0]\n"));
		fprintf(mStream, _T("\n}\n"));
		fprintf(mStream, _T("\n}\n"));

		delete mLodList;
		delete mTimerList;
	}

 // give third party dlls a chance to write after the scene was written
	for (cnt = 0; cnt < mCallbacks->GetPostSceneCount(); cnt++)
	{
		DllPostScene postScene = mCallbacks->GetPostScene(cnt);
		PostSceneParam params;
		params.version = 0;
		params.fName   = mFilename;
		params.i       = mIp;
		if (mStream)
			fclose(mStream), mStream = NULL;
		(*(postScene))(&params);
	}
	if (!mStream)
		mStream = _tfopen(mFilename, _T("a"));
	
	SetCursor(normal);
	if (hWndPB)
	{
		DestroyWindow(hWndPB);
		hWndPB = NULL;
	}
	if (hWndPDlg)
	{
		DestroyWindow(hWndPDlg);
		hWndPDlg = NULL;
	}

	if(theFile.Close())
		return 0;

	return 1;
}


WebGL2Export::WebGL2Export() 
{
	mGenNormals         = FALSE;
	mHadAnim            = FALSE;
	mLodList            = NULL;
	mTimerList          = NULL;
	mTformSample        = TRUE;
	mTformSampleRate    = 10;
	mCoordSample        = FALSE;
	mCoordSampleRate    = 3;
	mHasLights          = FALSE;
	mHasNavInfo         = FALSE;
	mFlipBook           = FALSE;

	mStream = 0;     // The file mStream to write
	mFilename = NULL;   // The export .js filename
	mIndent = TRUE;     // Should we indent?
	mType = Export_ThreeJS;       // Language to export (WebGL, WebGL, ...)
	mCamera = NULL;     // Initial camera;
	mNavInfo = NULL;    // Initial Navigation Info;
	mBackground = NULL; // Initial Background node
	mFog = NULL;        // Initial Fog node
	mUsePrefix = FALSE;  // Use URL Prefix
	//mUrlPrefix;  // The URL prefix
	mGenFields = FALSE;  // Generate "fields" statements
	//TimeValue      mStart;      // First frame of the animation
	//TSTR           mTimer;      // Name of active TimeSensor
	//Tab<int>       mInterpTypes;// Type of interpolator nodes
//	float          mCycleInterval; // Length of animation in seconds
	//Tab<InterpRoute> mInterpRoutes; // Routes for Intpolator nodes
	//Tab<AnimRoute> mAnimRoutes;  // route nodes from anim
	//BOOL           mZUp;        // Z axis if true, Y axis otherwise
	mDigits = 3;     // Digits of precision on output
	mCoordInterp = FALSE;// Generate coordinate interpolators
#ifdef _LEC_
	BOOL           mFlipBook = FALSE;   // Generate one WebGL file per frame (LEC request)
#endif
/*
	BOOL           mTformSample;// TRUE for once per frame
	int            mTformSampleRate; // Custom sample rate
	BOOL           mCoordSample; // TRUE for once per frame
	int            mCoordSampleRate; // Custom sample rate
	ObjectHashTable mObjTable;    // Hash table of all objects in the scene
	SensorHashTable mSensorTable; // Hash table of all TouchSensor and Anchors
	Box3           mBoundBox;     // Bounding box for the whole scene
	TSTR           mTitle;        // Title of world
	TSTR           mInfo;         // Info for world
	BOOL           mExportHidden; // Export hidden objects
	BOOL           mPrimitives;   // Create WebGL primitves
	BOOL           mHasLights;    // TRUE iff scene has lights
	BOOL           mHasNavInfo;   // TRUE iff scene has NavigationInfo
	int             mPolygonType;   // 0 triangles, 1 quads, 2 ngons
	NodeTable       mNodes;         // hash table of all nodes name in the scene
	BOOL            mEnableProgressBar;      // this is used by the progress bar
	BOOL            mPreLight;      // should we calculate the color per vertex
	BOOL            mCPVSource;     // 1 if MAX's; 0 if should we need to calculate the color per vertex
	*/
	mCallbacks = NULL;     // export callback methods

}

WebGL2Export::~WebGL2Export()
{
}

// Traverse the scene graph generating Unique Node Names
void 
WebGL2Export::GenerateUniqueNodeNames(INode* node)
{
	if (!node)
		return;

	NodeList* nList = mNodes.AddNode(node);
	if (!nList->hasName)
	{
	 // take mangled name and get a unique name
		nList->name    = mNodes.AddName(WebGLName(node->GetName()));
		nList->hasName = TRUE;
	}
	
	int n = node->NumberOfChildren();
	for (int i = 0; i < n; i++)
		GenerateUniqueNodeNames(node->GetChildNode(i));

}

// SR NOTE64: The hash code remains a 32 bit value, even for 64 bit pointers, since
// the hash table is a Tab<>, which doesn't go over 2G, for one, but also because it
// would not make much sense to have the hash code so bigly huge.
static DWORD HashCode(void* o, int size)	
{
	return (reinterpret_cast<DWORD_PTR>(o) >> 2) % size;
}

// Object Hash table stuff

ObjectBucket*
ObjectHashTable::AddObject(Object* o)
{
	DWORD hashCode = HashCode(o, OBJECT_HASH_TABLE_SIZE);	
	ObjectBucket *ob;

	for(ob = mTable[hashCode]; ob; ob = ob->next)
	{
		if (ob->obj == o)
		{
			return ob;
		}
	}
	ob = new ObjectBucket(o);
	ob->next = mTable[hashCode];
	mTable[hashCode] = ob;
	return ob;
}

void 
SensorHashTable::AddSensor(INode* node, INode* sensor)
{
	DWORD hashCode = HashCode(node, SENSOR_HASH_TABLE_SIZE);	
	SensorBucket *sb;
	
	for (sb = mTable[hashCode]; sb; sb = sb->mNext)
	{
		if (sb->mNode == node)
		{
			sb->mSensors = sb->mSensors->AddNode(sensor);
			return;
		}
	}
	sb = new SensorBucket(node);
	sb->mSensors = sb->mSensors->AddNode(sensor);
	sb->mNext = mTable[hashCode];
	mTable[hashCode] = sb;
}


SensorBucket* 
SensorHashTable::FindSensor(INode* node)
{
	DWORD hashCode = HashCode(node, SENSOR_HASH_TABLE_SIZE);
	SensorBucket *sb;
	
	for (sb = mTable[hashCode]; sb; sb = sb->mNext)
	{
		if (sb->mNode == node)
		{
			return sb;
		}
	}
	return NULL;
}
