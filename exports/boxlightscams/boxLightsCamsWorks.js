{
"metadata": {
  "formatVersion": 3,
  "type": "scene",
  "sourceFile": "boxLightsCams.max",
  "generatedBy" : "3D Studio MAX WebGL exporter, Version 14, Revision 1.21"
},

"urlBaseType" : "",

"lights":
{

      "FDirect001": {
        "type": "directional",
        "intensity": 1,
        "direction": [0,0,-1],
        "color": 1065353216
      },
      "Omni001": {
        "type": "point",
        "intensity": 1,
        "color": 1065353216,
        "position": [0, 0, 0],
        "radius": 200
      },
      "Fspot001": {
        "type": "spot",
        "intensity": 1,
        "color": [1,1,1],
        "position": [0, 0, 0],
        "direction": [0,0,-1],
        "cutOffAngle": 0.785,
        "beamWidth": 0.75,
        "radius": 3.46e+030
      }
},

"cameras":
{

      "Camera001": {
        "type": "perspective",
        "position": [0, 0, 0],
        "fov": 0.602,
		"target"  : [0,0,0]
      },
      "Camera002": {
        "type": "perspective",
        "position": [0, 0, 0],
        "fov": 0.602,
		"target"  : [0,0,0]
      }
},

"materials":
{

      "01 - Default": {
        "type": "MeshLambertMaterial",
        "parameters": {
          "color": 1058444951,
          "shading": "flat",
          "colorSpecular": 0,
          "specularCoef": 0.145,
          "opacity": 1,
          "map" : "BARK5.jpg"
        }
      }
    
},

"objects":
{

    "Box001": {
      "position": [-14.966,-11.565,0.000],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "materials": ["01 - Default"      ],
      "geometry": "Box001_geo",
      "visible": true
    }
},

"textures":
{
        "BARK5.jpg" : {
        "url" : "BARK5.jpg"
        }
    
},


"geometries":
{

    "Box001_geo": {
      "type": "embedded_mesh",
      "id" : "Box001_emb"
    }
},


"embeds":
{

      "Box001_emb" : {
    "metadata" : { "formatVersion" : 3 },
"scale" : 1.0,
"materials" : [],
        "vertices" : [
          -61.905,-48.299,0.000, 61.905,-48.299,0.000, -61.905,48.299,0.000, 
          61.905,48.299,0.000, -61.905,-48.299,55.782, 61.905,-48.299,55.782, 
          -61.905,48.299,55.782, 61.905,48.299,55.782],
        "uvs" : [[
          0,0, 1,0, 0,1, 1,1, 0,0, 1,0, 0,1, 1,1, 0,0, 1,0, 0,1, 
          1,1]],
        "faces" : [
          10, 0, 2, 3, 0, 9,11,10,10, 3, 1, 0, 0, 10,8,9,10, 4, 5, 7, 0, 8,9,11,
          10, 7, 6, 4, 0, 11,10,8,10, 0, 1, 5, 0, 4,5,7,10, 5, 4, 0, 0, 7,6,4,
          10, 1, 3, 7, 0, 0,1,3,10, 7, 5, 1, 0, 3,2,0,10, 3, 2, 6, 0, 4,5,7,
          10, 6, 7, 3, 0, 7,6,4,10, 2, 0, 4, 0, 0,1,3,10, 4, 6, 2, 0, 3,2,0]
        }
},

"defaults":
{
  "bgcolor" : [0,0,0]

}

}
