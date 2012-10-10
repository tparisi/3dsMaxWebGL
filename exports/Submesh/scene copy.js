{
	"metadata": {
		"formatVersion": 3.1,
	"type" : "scene"
	},
	"urlBaseType" : "",
	"objects": {
		"submesh" : {
			"geometry" : "submesh",
			"materials" : ["Material","Material_001"],
			"position" : [1.780413,0,0],
			"rotation" : [0, 0, 0],
			"scale" : [1,1,-1],
			"visible" : true
		}

	},
	"geometries": {
		"submesh" : {
			"type" : "embedded_mesh",
			"id" : "submesh_emb"
		}
	},
	"materials" : {
		"Material" : {
			"type" : "MeshBasicMaterial",
			"parameters" : {
				"color" : 16711680,
				"opacity": 1,
				"map" : "windows7"
			}
		},
		"Material_001" : {
			"type" : "MeshBasicMaterial",
			"parameters" : {
				"color" : 16777215,
				"opacity": 1,
				"map" : "earth"
			}
		}
	},
	"embeds" : {
		"submesh_emb" : {
			"metadata" : { "formatVersion" : 3 },
			"scale" : 1.0,
			"materials" : [
			{
				"DbgColor": 9868950,
				"DbgIndex": -1,
				"DbgName": "Material",
				"colorAmbient": [1,0,0],
				"colorDiffuse": [1,0,0],
				"colorSpecular": [1,0,0],
				"specularCoef": 0.1,
				"vertexColors": false,
				"opacity": 1
			},
			{
				"DbgColor": 9868950,
				"DbgIndex": -1,
				"DbgName": "Material_001",
				"colorAmbient": [1,1,1],
				"colorDiffuse": [1,1,1],
				"colorSpecular": [1,1,1],
				"specularCoef": 0.1,
				"vertexColors": false,
				"opacity": 1
			}			],
				"vertices" : [
-4.909926,1,0,
 -4.909926,-1,0,
 -2.909926,-1,0,
 -2.909926,1,0,
 -1,1,0,
 -1,-1,0,
 1,-1,0,
 1,1,0],
				"normals" : [
0,0,-1,
 0,0,-1,
 0,0,-1,
 0,0,-1,
 0,0,-1,
 0,0,-1,
 0,0,-1,
 0,0,-1				],
				"uvs" : [
				[0,0,
 0,1,
 1,1,
 1,0,
 0,0,
 0,1,
 1,1,
 1,0				]],
				"faces" : [
42,3,0,2,0,3,0,2,3,0,2,
42,2,0,1,0,2,0,1,2,0,1,
42,7,4,6,1,7,4,6,7,4,6,
42,6,4,5,1,6,4,5,6,4,5				]
,
			"morphTargets": [],
			"edges": []
		}

	},
	"textures" : {
		"windows7" : {
			"url" : "windows7.png"
		},
		"earth" : {
			"url" : "earth.jpg"
		}
	},
	"cameras" : {

	},
	"lights" : {

	},
	"defaults": {
		"bgalpha" : 1,
		"camera" : "Main Camera",
		"bgcolor" : ["0,0,0"]
	}
}
