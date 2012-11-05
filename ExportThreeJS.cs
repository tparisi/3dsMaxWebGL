using UnityEngine;
using UnityEditor;
using System.Collections;
using System.IO;
using System.Text;

public class ExportThreeJS : ScriptableWizard
{
	public string savedPath = EditorPrefs.GetString ("3JSPath", "/");
	public bool exportEntireScene = true;
   
    [MenuItem ("File/Export/WebGL/ThreeJS")]
	static void CreateWizard()
	{
		ScriptableWizard.DisplayWizard("Export Selected Stuff to ThreeJS", typeof(ExportThreeJS), "Export");
	}

	void OnWizardUpdate ()
	{
		savedPath = EditorPrefs.GetString ("3JSPath", "/");
		Debug.Log ("remembered "+savedPath);
		if (Selection.gameObjects.Length == 0)
		{
			exportEntireScene = true;
			Object[] objs = FindObjectsOfType(typeof(GameObject));
	        ArrayList selectionBuilder = new ArrayList();        
	        foreach (GameObject go in objs)
				selectionBuilder.Add(go);
	        Selection.objects = selectionBuilder.ToArray(typeof(GameObject)) as GameObject[];
		}
		else
			; // file name is based on one selected object
	}
	
    void OnWizardCreate() // Create (Export) button has been hit (NOT wizard has been created!)
    {
		// var path = EditorUtility.SaveFolderPanel("Save textures to directory", "", "");

        string filePath = EditorUtility.SaveFolderPanel("Export WebGL files", savedPath, "");
		EditorPrefs.SetString("3JSPath", filePath);
		ThreeJSExporterScript.SceneToFolder (filePath, false);
    }
}

public static class ThreeJSExporterScript
{
	static ArrayList exportMats; // collect list of mats as we go
	static ArrayList exportMatNames; // collect list of mats as we go
	static ArrayList exportMatEmbs; // collect list of mats as we go
	static ArrayList exportTxs;
	static string folderPath;
	
	public static string SceneToString ()
	{
		exportMats = new ArrayList();
		exportMatNames = new ArrayList();
		exportMatEmbs = new ArrayList();
		exportTxs = new ArrayList();
		int indent = 1;
		StringBuilder sb = new StringBuilder();
		// Header
		sb.Append ("{\n");
		TabAppend (indent, sb,  "'metadata': {\n");
		TabAppend (indent+1, sb,  "'formatVersion': 3.1,\n");
		TabAppend (indent, sb,  "'type' : 'scene'\n");
		TabAppend (indent, sb,  "},\n");

		TabAppend (indent, sb,  "'urlBaseType' : '',\n"); // relativeToHTML

		TabAppend (indent, sb,  "'objects': {\n");
		bool first = true;
		foreach  (GameObject o in Selection.gameObjects)
		{
			ObjectToString(indent+1, sb, o, ref first);
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");

		TabAppend (indent, sb,  "'geometries': {\n");
		first = true;
		foreach  (GameObject o in Selection.gameObjects)
		{
//			GeometryToString(sb, o, ref first); 
			GeometryToEmbedString(indent+1, sb, o, ref first); 
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");
		
		first = true;
		TabAppend (indent, sb,  "'materials' : {\n");
		foreach  (GameObject o in Selection.gameObjects)
		{
			MaterialsToString(indent+1, sb, o, ref first, false);
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");
		
		first = true;
		TabAppend (indent, sb,  "'embeds' : {\n");
		foreach  (GameObject o in Selection.gameObjects)
		{
			MeshFilter mf = o.GetComponent(typeof(MeshFilter)) as MeshFilter;
			if (mf && mf.sharedMesh)
				ObjectToEmbedString(indent+1, sb, o, ref first);
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");

		first = true;
		TabAppend (indent, sb,  "'textures' : {\n");
		foreach  (GameObject o in Selection.gameObjects)
		{
			TexturesToString (indent+1, sb, o, ref first);
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");
		
		first = true;
		TabAppend (indent, sb,  "'cameras' : {\n");
		foreach  (GameObject o in Selection.gameObjects)
		{
			CameraToString (indent+1, sb, o, ref first);
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");
		
		first = true;
		TabAppend (indent, sb,  "'lights' : {\n");
		foreach  (GameObject o in Selection.gameObjects)
		{
			LightToString (indent+1, sb, o, ref first);
		}
		sb.Append ("\n");
		TabAppend (indent, sb,  "},\n");
		
		TabAppend (indent, sb,  "'defaults': {\n");
		TabAppend (indent+1, sb, "'bgalpha' : 1,\n");
		TabAppend (indent+1, sb, "'camera' : '" + Camera.main.name + "',\n"); // FIX
		if (RenderSettings.fog)
			TabAppend (indent+1, sb, "'fog' : '"+ ColorToString(RenderSettings.fogColor)+"'\n,"); // FIX
		TabAppend (indent+1, sb, "'bgcolor' : ['" + "0,0,0" + "']\n"); // FIX
		TabAppend (indent, sb, "}\n");
		TabAppend (0, sb, "}");

		return sb.ToString();
	}
	
    public static void ObjectToString(int tab, StringBuilder sb, GameObject o, ref bool first)
	{
		MeshFilter mf = o.GetComponent(typeof(MeshFilter)) as MeshFilter;

		if (mf && mf.sharedMesh)
		{
	        Material[] mats = mf.renderer.sharedMaterials;
			// For each object (for now, one object)
			if (first)
				first = false;
			else
				sb.Append (",\n");
			TabAppend (tab, sb, "'" + o.name+"' : {\n");
			TabAppend (tab+1, sb,  "'geometry' : '" + o.name + "',\n");
			TabAppend (tab+1, sb,  "'materials' : [");
			for (int i = 0; i < mats.Length; i++)
			{
				if (exportMatNames.Contains(mats[i]))
					continue;
				exportMatNames.Add(mats[i]);
				if (i != 0)
					sb.Append(",");
				sb.Append ("'"+mats[i].name+"'");
			}
			sb.Append ("],\n");
			TabAppend (tab+1, sb,  "'position' : [" + Vec3ToString(o.transform.position) + "],\n");
			Vector3 angles = o.transform.rotation.eulerAngles;
		//	angles.x = (360f - angles.x) % 360f;
			TabAppend (tab+1, sb,  "'rotation' : [" + Vec3ToString(angles * 3.1415926f / 180f) + "],\n");
			TabAppend (tab+1, sb,  "'scale' : [" + Scale3ToString(o.transform.lossyScale) + "],\n");
			TabAppend (tab+1, sb,  "'visible' : true\n");
			TabAppend (tab, sb,  "}\n");
		}
	}
	
	public static void ObjectToEmbedString (int tab, StringBuilder sb, GameObject o, ref bool first)
	{
		if (first)
			first = false;
		else
			sb.Append (",");
		TabAppend (tab, sb, "'" + o.name+"_emb' : {\n");
		TabAppend (tab+1, sb, "'metadata' : { 'formatVersion' : 3 },\n");
		TabAppend (tab+1, sb, "'scale' : 1.0,\n");

		TabAppend (tab+1, sb, "'materials' : [\n");
		bool mFirst = true;
		MaterialsToString(tab+1, sb, o, ref mFirst, true);
		TabAppend (tab+1, sb, "],\n");
		bool gFirst = true;
		GeometryToString(tab+1, sb, o, ref gFirst, true);
		sb.Append (",\n");
		TabAppend (tab+1, sb, "'morphTargets': [],\n");
		TabAppend (tab+1, sb, "'edges': []\n");
		TabAppend (tab, sb, "}\n");
	}

    public static void GeometryToString(int tab, StringBuilder sb, GameObject o, ref bool first, bool embed)
	{
		MeshFilter mf = o.GetComponent(typeof(MeshFilter)) as MeshFilter;

		if (mf && mf.sharedMesh)
		{
			MeshToString(tab, sb, mf, ref first, embed);
		}
	}

    public static void GeometryToEmbedString(int tab, StringBuilder sb, GameObject o, ref bool first)
	{
		MeshFilter mf = o.GetComponent(typeof(MeshFilter)) as MeshFilter;

		if (mf && mf.sharedMesh)
		{
			if (first)
				first = false;
			else
				sb.Append (",\n");
			TabAppend (tab, sb,  "'"+o.name+"' : {\n");
			TabAppend (tab+1, sb,  "'type' : 'embedded_mesh',\n");
			TabAppend (tab+1, sb,  "'id' : '"+o.name+"_emb'\n");
			TabAppend (tab, sb,  "}");
		}
	}
	
	static string MaterialToTypeString (Material mat)
	{
		string shaderName = mat.shader.name;
		string t = "MeshBasicMaterial";
		return t;
		switch (shaderName)
		{
			case "Diffuse":
			case "Transparent/Diffuse":
				t = "MeshPhongMaterial";
				break;
			case "Unlit/Texture":
				break;
		}
		return t;
	}
	
    public static void MaterialsToString(int tab, StringBuilder sb, GameObject o, ref bool first, bool embed)
	{

/*
 * MeshBasicMaterial : Unlit can texture, evnmap, lightmap, spec map, 
 * MeshPhongMaterial : Lit, same as above, bump
 * 
 * 
 * 
 */
		MeshFilter mf = o.GetComponent(typeof(MeshFilter)) as MeshFilter;

		if (mf && mf.sharedMesh)
		{
	        Material[] mats = mf.renderer.sharedMaterials;
			foreach (Material mat in mats)
			{
				if (embed)
					MaterialToEmbedString(tab, sb, mat, ref first);
				else
					MaterialToString(tab, sb, mat, ref first);
			}
		} // if mesh objects
	}
	
	public static void MaterialToString (int tab, StringBuilder sb, Material mat, ref bool first)
	{
		if (exportMats.Contains(mat))
			return;
		exportMats.Add(mat);
		if (first)
			first = false;
		else
			sb.Append (",\n");
		TabAppend (tab, sb,  "'" + mat.name + "' : {\n");
		TabAppend (tab+1, sb, "'type' : '"+MaterialToTypeString(mat)+"',\n");
		TabAppend (tab+1, sb, "'parameters' : {\n");
		long ci = ColorToLong(mat.color);
		TabAppend (tab+2, sb, "'color' : " + ci.ToString() + ",\n");
		if (mat.mainTexture != null)
			TabAppend (tab+2, sb, "'map' : '" + mat.mainTexture.name + "',\n");
		TabAppend (tab+2, sb, "'opacity': "+(mat.color.a)+"\n");
	//	sb.Append ("'color' : 16711680, "specular": 16711680, "shininess": 25, "bumpMap": "texture_bump", "bumpScale": -0.75 }
		TabAppend (tab+1, sb, "}\n");
		TabAppend (tab, sb,  "}");
	}

	public static void MaterialToEmbedString (int tab, StringBuilder sb, Material mat, ref bool first)
	{
		if (exportMatEmbs.Contains(mat))
			return;
		exportMatEmbs.Add(mat);
		if (first)
			first = false;
		else
			sb.Append (",\n");
		TabAppend (tab, sb, "{\n");
		TabAppend (tab+1, sb, "'DbgColor': 9868950,\n");
		TabAppend (tab+1, sb, "'DbgIndex': -1,\n");
		TabAppend (tab+1, sb, "'DbgName': '"+mat.name+"',\n");
		TabAppend (tab+1, sb, "'colorAmbient': ["+ColorToString(mat.color)+"],\n");
		TabAppend (tab+1, sb, "'colorDiffuse': ["+ColorToString(mat.color)+"],\n");
		TabAppend (tab+1, sb, "'colorSpecular': ["+ColorToString(mat.color)+"],\n");
		TabAppend (tab+1, sb, "'specularCoef': "+.1+",\n");
//		TabAppend (tab+1, sb, "'transparency': "+mat.color.a+",\n");
		TabAppend (tab+1, sb, "'vertexColors': false,\n");
		TabAppend (tab+1, sb, "'opacity': 1\n");//"+(1f-mat.color.a)+"\n");
		TabAppend (tab, sb, "}");
	}

	public static void TexturesToString (int tab, StringBuilder sb, GameObject o, ref bool first)
	{
		MeshFilter mf = o.GetComponent(typeof(MeshFilter)) as MeshFilter;

		if (mf && mf.sharedMesh)
		{
	        Material[] mats = mf.renderer.sharedMaterials;
			foreach (Material mat in mats)
			{
				if (mat.mainTexture != null)
					TextureToString (tab, sb, mat.mainTexture, ref first); // FIX
			}
		}
	}
	
	public static void TextureToString (int tab, StringBuilder sb, Texture tx, ref bool first)
	{
		if (exportTxs.Contains(tx))
			return;
		exportTxs.Add(tx);
		if (first)
			first = false;
		else
			sb.Append (",\n");
		TabAppend (tab, sb,  "'" + tx.name+"' : {\n");

		int instId = tx.GetInstanceID();
		string assetPath = AssetDatabase.GetAssetPath(tx);
//		string destFile = folderPath + "/"+ Path.GetFileNameWithoutExtension(assetPath)+".png";
		string destFile = folderPath + "/" + Path.GetFileName(assetPath);
		string destPath = Path.GetDirectoryName(destFile);
//		if (!Directory.Exists(destPath))
//			Directory.CreateDirectory (destPath);
		try
		{
			File.Copy (assetPath, destFile);
		}
		catch 
		{
		}
/*
		Texture2D tx2d = (Texture2D)tx;
		byte[] bytes = tx2d.EncodeToPNG();
		string destFile = folderPath+tx.name+".png";
		System.IO.File.WriteAllBytes(destFile, bytes);
*/
		TabAppend (tab+1, sb,  "'url' : '" + tx.name+".png" + "'\n");
		TabAppend (tab, sb,  "}");
	}
	
	public static void MeshToString (int tab, StringBuilder sb, MeshFilter mf, ref bool first, bool embed)
	{
        Mesh m = mf.sharedMesh;
		if (first)
			first = false;
		else
			sb.Append (",");
		if (!embed)
	        TabAppend (tab, sb,  "'" + mf.name + "' : {\n");
		TabAppend (tab+1, sb,  "'vertices' : [\n");
		bool firstv = true;
        for (int i = 0; i < m.vertices.Length; i++)
		{
			Vector3 v = m.vertices[i];
			if (firstv)
			{
				firstv = false;
	            sb.Append (Vec3ToString(v));
			}
			else
	            sb.Append (",\n "+Vec3ToString(v));
        }
        sb.Append ("],\n");
		TabAppend (tab+1, sb,  "'normals' : [\n");
		firstv = true;
        foreach(Vector3 v in m.normals)
		{
			if (firstv)
			{
				firstv = false;
	            sb.Append (Vec3ToString(v));
			}
			else
	            sb.Append (",\n "+Vec3ToString(v));
        }
        TabAppend (tab+1, sb,  "],\n");
		TabAppend (tab+1, sb,  "'uvs' : [\n");
		firstv = true;
		TabAppend (tab+1, sb,  "[");
        for (int i = 0; i < m.uv.Length; i++)
		{
			Vector2 v = m.uv[i];
			if (v.x > 1f || v.x < 1f)
				v.x = v.x % 1f;
			if (v.x < 0f)
				v.x += 1f;
			
			if (v.y > 1f || v.y < -1f)
				v.y = v.y % 1f;
			if (v.y < 0f)
				v.y += 1f;
			if (firstv)
			{
				firstv = false;
	            sb.Append (Vec2ToString(v));
			}
			else
	            sb.Append (",\n "+Vec2ToString(v));
        }
	/* if shader warrants it...
        TabAppend (tab+1, sb,  "],\n");
		TabAppend (tab+1, sb,  "[");
		firstv = true;
        foreach(Vector2 v in m.uv1)
		{
			if (firstv)
			{
				firstv = false;
	            sb.Append (Vec2ToString(v));
			}
			else
	            sb.Append (",\n "+Vec2ToString(v));
        }
        TabAppend (tab+1, sb,  "],\n");
		TabAppend (tab+1, sb,  "[");
		firstv = true;
        foreach(Vector2 v in m.uv2)
		{
			if (firstv)
			{
				firstv = false;
	            sb.Append (Vec2ToString(v));
			}
			else
	            sb.Append (",\n "+Vec2ToString(v));
        }
       */
        TabAppend (tab+1, sb,  "]],\n");
		
		TabAppend (tab+1, sb,  "'faces' : [\n");
for (int s=0; s < m.subMeshCount; s++)
{
		if (s > 0)
			sb.Append(",\n");
        int[] triangles = m.GetTriangles(s);
		bool fFirst = true;
        for (int i=0; i < triangles.Length; i += 3)
		{
			if (fFirst)
				fFirst = false;
			else
				sb.Append(",\n");
			int bitField = 0;
/*
	isQuad          	= isBitSet( type, 0 ); 1
	hasMaterial         = isBitSet( type, 1 ); 2
	hasFaceUv           = isBitSet( type, 2 ); 4
	hasFaceVertexUv     = isBitSet( type, 3 ); 8
	hasFaceNormal       = isBitSet( type, 4 ); 16
	hasFaceVertexNormal = isBitSet( type, 5 ); 32
	hasFaceColor	    = isBitSet( type, 6 ); 64
	hasFaceVertexColor  = isBitSet( type, 7 ); 128
*/
			bitField |= 2; // materials
			bitField |= 32; // normals
			if (m.uv.Length > 0)
				bitField |= 8; // ONLY IF IT HAS A TEXTURE
			int id = s;//mesh.faces[i].getMatID();
			// NOTE! This 5th item is 'material index'
			sb.Append (bitField.ToString()+",");
			sb.Append (triangles[i].ToString()+",");
			sb.Append (triangles[i+2].ToString()+",");
			sb.Append (triangles[i+1].ToString()+",");
			sb.Append (exportMats.IndexOf(mf.renderer.sharedMaterials[s]) +",");
			if (m.uv.Length > 0) // has UVs
			{
			//	int id = 0; // FIX mesh.faces[i].getMatID();
				sb.Append (triangles[i].ToString()+",");
				sb.Append (triangles[i+2].ToString()+",");
				sb.Append (triangles[i+1].ToString()+",");
			}
			// for normals
			sb.Append (triangles[i].ToString()+",");
			sb.Append (triangles[i+2].ToString()+",");
			sb.Append (triangles[i+1].ToString());
		} // for each triangle face
} // for each submesh
        TabAppend (tab+1, sb,  "]\n");

		//FIX
//        foreach(Color c in m.colors) {
//            sb.Append (string.Format("vc {0} {1} {2} {3}\n",c.r,c.g,c.b,c.a));
//        }
		/*
        for (int material=0; material < m.subMeshCount; material ++) {
            sb.Append ("\n");
            sb.Append ("usemtl ").Append(mats[material].name).Append("\n");
            sb.Append ("usemap ").Append(mats[material].name).Append("\n");
               
            int[] triangles = m.GetTriangles(material);
            for (int i=0;i<triangles.Length;i+=3) {
                sb.Append (string.Format("f {0}/{0}/{0} {1}/{1}/{1} {2}/{2}/{2}\n",
                    triangles[i]+1, triangles[i+1]+1, triangles[i+2]+1));
            }
        }
        */
		if (!embed)
			TabAppend (tab, sb,  "}");
    }
   
    public static void CameraToString(int tab, StringBuilder sb, GameObject o, ref bool first)
	{
		Camera cam = o.GetComponent<Camera>();

		if (cam)
		{
			if (first)
				first = false;
			else
				sb.Append (",\n");
			TabAppend (tab, sb, "'" + o.name+"' : {\n");
			TabAppend (tab+1, sb,  "'type' : '" + (cam.isOrthoGraphic ? "ortho" : "perspective") + "',\n");
			TabAppend (tab+1, sb,  "'fov' : " + cam.fov.ToString() + ",\n");
			TabAppend (tab+1, sb,  "'aspect' : " + cam.aspect.ToString() + ",\n");
			TabAppend (tab+1, sb,  "'near' : " + cam.near.ToString() + ",\n");
			TabAppend (tab+1, sb,  "'far' : " + cam.far.ToString() + ",\n");
			TabAppend (tab+1, sb,  "'position' : [" + Vec3ToString(cam.transform.position) + "],\n");
			TabAppend (tab+1, sb,  "'target' : [" + Vec3ToString(Vector3.zero) + "]\n");
			TabAppend (tab, sb,  "}");
		}
	}
	
    public static void LightToString(int tab, StringBuilder sb, GameObject o, ref bool first)
	{
		Light lite = o.GetComponent<Light>();

		if (lite)
		{
			if (first)
				first = false;
			else
				sb.Append (",\n");
			TabAppend (tab, sb,  "'" + o.name+"' : {\n");
			TabAppend (tab+1, sb,  "'type' : ");
			switch (lite.type)
			{
				case LightType.Directional:
					sb.Append ("'directional',\n");
					TabAppend (tab+1, sb,  "'direction' : [" + Vec3ToString(lite.transform.eulerAngles) + "],\n");
					break;
				case LightType.Point:
					sb.Append ("'point',\n");
					TabAppend (tab+1, sb,  "'position' : [" + Vec3ToString(lite.transform.position) + "],\n");
					break;
				case LightType.Spot:
					sb.Append ("'spot',\n");
					TabAppend (tab+1, sb,  "'position' : [" + Vec3ToString(lite.transform.position) + "],\n");
					break;
				case LightType.Area:
					sb.Append ("'area',\n");
					break;
			}
			TabAppend (tab+1, sb,  "'color' : [" + ColorToString(lite.color)+"],\n");
			TabAppend (tab+1, sb,  "'intensity' : " + lite.intensity.ToString() + "\n");
			TabAppend (tab, sb,  "}");
		}
	}
	
    public static void SceneToFolder(string foldername, bool append)
    {
        try
        {
			folderPath = foldername;
            using (StreamWriter sw = new StreamWriter(foldername+"\\scene.js", append))
            {
                sw.WriteLine(SceneToString().Replace("'", "\""));
            }
        }
        catch (System.Exception)
        {
        }
    }
	
	static string Vec2ToString (Vector2 v)
	{
		return (v.x.ToString()+","+v.y.ToString());
	}
	static string Vec3ToString (Vector3 v)
	{
		return (v.x.ToString()+","+v.y.ToString()+","+(-v.z).ToString());
	}
	static string Scale3ToString (Vector3 v)
	{
		return (v.x.ToString()+","+v.y.ToString()+","+(v.z).ToString());
	}
	static string ColorToString (Color v)
	{
		return (v.r.ToString()+","+v.g.ToString()+","+v.b.ToString());
	}
	static long ColorToLong (Color v)
	{
		long r = (long)(v.r * 255f);
		long g = (long)(v.g * 255f);
		long b = (long)(v.b * 255f);
		return (long)(r * 256 * 256) +  g * 256 + b;
	}
	
	static void TabAppend (int tab, StringBuilder sb, string val)
	{
		for (int i = 0; i < tab; i++)
			sb.Append("\t");
		sb.Append (val);
	}
}