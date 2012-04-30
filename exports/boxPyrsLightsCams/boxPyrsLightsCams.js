{
"metadata": {
  "formatVersion": 3,
  "type": "scene",
  "sourceFile": "boxPyrLightsCams.max",
  "generatedBy" : "3D Studio MAX WebGL exporter, Version 14, Revision 1.21"
},
"urlBaseType": "",

"lights":
{

      "FDirect001": {
        "type": "directional",
        "intensity": 1,
        "direction": [0,-1,0],
        "color": 16777215
      },
      "Omni001": {
        "type": "point",
        "intensity": 1,
        "color": 16777215,
        "position": [0, 0, 0],
        "radius": 200
      },
      "Fspot001": {
        "type": "spot",
        "intensity": 1,
        "color": 16777215,
        "position": [0, 0, 0],
        "direction": [0,-1,0],
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
        "target": [0, 0, 0],
        "fov": 0.602
      },
      "Camera002": {
        "type": "perspective",
        "position": [0, 0, 0],
        "target": [0, 0, 0],
        "fov": 0.602
      }
},

"materials":
{

      "01 - Default_-1": {
        "type": "MeshLambertMaterial",
        "parameters": {
          "color": 9868950,
          "shading": "flat",
          "colorSpecular": 0,
          "specularCoef": 0.145,
          "map" : "BARK5.jpg",
          "opacity": 1
        }
      }
    ,
      "02 - Default_-1": {
        "type": "MeshLambertMaterial",
        "parameters": {
          "color": 255,
          "shading": "flat",
          "colorSpecular": 0,
          "specularCoef": 0.145,
          "opacity": 1
        }
      }
    ,
      "04 - Default_-1": {
        "type": "MeshLambertMaterial",
        "parameters": {
          "color": 16711680,
          "shading": "flat",
          "colorSpecular": 0,
          "specularCoef": 0.145,
          "opacity": 1
        }
      }
    ,
      "03 - Default_-1": {
        "type": "MeshLambertMaterial",
        "parameters": {
          "color": 65280,
          "shading": "flat",
          "colorSpecular": 0,
          "specularCoef": 0.145,
          "opacity": 1
        }
      }
    
},

"objects":
{

    "Box001": {
      "position": [-14.966,0.000,11.565],
      "rotation": [0,0,0],
      "scale": [1,1,1],
      "geometry": "Box001_geo",
      "visible": true,
      "materials": ["01 - Default_-1"]
    },
    "Pyramid001": {
      "position": [285.594,0.005,-193.479],
      "rotation": [0,0,0],
      "scale": [1,1,1],
      "geometry": "Pyramid001_geo",
      "visible": true,
      "materials": ["02 - Default_-1"]
    },
    "Pyramid002": {
      "position": [-70.099,0.005,181.869],
      "rotation": [-1,0,0,-1.54],
      "scale": [1,1,1],
      "geometry": "Pyramid002_geo",
      "visible": true,
      "materials": ["04 - Default_-1"]
    },
    "Pyramid003": {
      "position": [60.708,26.740,12.088],
      "rotation": [0.577,-0.577,0.577,-4.19],
      "scale": [1,1,1],
      "geometry": "Pyramid003_geo",
      "visible": true,
      "materials": ["03 - Default_-1"]
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
    },
    "Pyramid001_geo": {
      "type": "embedded_mesh",
      "id" : "Pyramid001_emb"
    },
    "Pyramid002_geo": {
      "type": "embedded_mesh",
      "id" : "Pyramid002_emb"
    },
    "Pyramid003_geo": {
      "type": "embedded_mesh",
      "id" : "Pyramid003_emb"
    }
},


"embeds":
{

      "Box001_emb" : {
          "scale" : 1.0,
          "materials" : [],
          "metadata" : { "formatVersion" : 3 },
        "vertices" : [
          -61.905,0.000,48.299, 61.905,0.000,48.299, -61.905,0.000,-48.299, 
          61.905,0.000,-48.299, -61.905,55.782,48.299, 61.905,55.782,48.299, 
          -61.905,55.782,-48.299, 61.905,55.782,-48.299],
        "normals" : [
          1,0,0, -1,0,0, 0,1,0, 0,0,1, 0,-1,0, 0,0,-1],
        "uvs" : [[
          0,0, 1,0, 0,1, 1,1, 0,0, 1,0, 0,1, 1,1, 0,0, 1,0, 0,1, 
          1,1
        ]],
        "faces" : [
          42, 0, 2, 3, 1, 9,11,10,4,4,4,42, 3, 1, 0, 1, 10,8,9,4
          ,4,4,42, 4, 5, 7, 0, 8,9,11,2,2,2,42, 7, 6, 4, 0, 11,10,8,2
          ,2,2,42, 0, 1, 5, 4, 4,5,7,3,3,3,42, 5, 4, 0, 4, 7,6,4,3
          ,3,3,42, 1, 3, 7, 3, 0,1,3,0,0,0,42, 7, 5, 1, 3, 3,2,0,0
          ,0,0,42, 3, 2, 6, 5, 4,5,7,5,5,5,42, 6, 7, 3, 5, 7,6,4,5
          ,5,5,42, 2, 0, 4, 2, 0,1,3,1,1,1,42, 4, 6, 2, 2, 3,2,0,1
          ,1,1]
      },
      "Pyramid001_emb" : {
          "scale" : 1.0,
          "materials" : [],
          "metadata" : { "formatVersion" : 3 },
        "vertices" : [
          0.000,93.933,-0.000, -75.256,0.000,84.738, 75.256,0.000,84.738, 
          75.256,0.000,-84.738, -75.256,0.000,-84.738, 0.000,0.000,-0.000],
        "normals" : [
          0,0.67,-0.743, 0.78,0.625,0, 0,-1,0, -0.78,0.625,0, 0,0.67,0.743
          ],
        "uvs" : [[

        ]],
        "faces" : [
          34, 0, 1, 2, 0,4,4,4,34, 0, 2, 3, 0,1,1,1,34, 0, 3, 4, 0,0
          ,0,0,34, 0, 4, 1, 0,3,3,3,34, 1, 5, 2, 0,2,2,2,34, 2, 5, 3, 0,2
          ,2,2,34, 3, 5, 4, 0,2,2,2,34, 4, 5, 1, 0,2,2,2]
      },
      "Pyramid002_emb" : {
          "scale" : 1.0,
          "materials" : [],
          "metadata" : { "formatVersion" : 3 },
        "vertices" : [
          0.000,45.374,-0.000, -33.408,0.000,35.384, 33.408,0.000,35.384, 
          33.408,0.000,-35.384, -33.408,0.000,-35.384, 0.000,0.000,-0.000],
        "normals" : [
          0,0.615,0.789, 0.805,0.593,0, 0,-1,0, 0,0.615,-0.789, -0.805,0.593,0
          ],
        "uvs" : [[

        ]],
        "faces" : [
          34, 0, 1, 2, 0,0,0,0,34, 0, 2, 3, 0,1,1,1,34, 0, 3, 4, 0,3
          ,3,3,34, 0, 4, 1, 0,4,4,4,34, 1, 5, 2, 0,2,2,2,34, 2, 5, 3, 0,2
          ,2,2,34, 3, 5, 4, 0,2,2,2,34, 4, 5, 1, 0,2,2,2]
      },
      "Pyramid003_emb" : {
          "scale" : 1.0,
          "materials" : [],
          "metadata" : { "formatVersion" : 3 },
        "vertices" : [
          0.000,-38.095,-0.000, -24.176,0.000,17.582, 24.176,0.000,17.582, 
          24.176,0.000,-17.582, -24.176,0.000,-17.582, 0.000,0.000,-0.000],
        "normals" : [
          -0.844,-0.536,0, 0,-0.419,-0.908, 0,1,0, 0.844,-0.536,0, 0,-0.419,0.908
          ],
        "uvs" : [[

        ]],
        "faces" : [
          34, 2, 1, 0, 0,4,4,4,34, 3, 2, 0, 0,3,3,3,34, 4, 3, 0, 0,1
          ,1,1,34, 1, 4, 0, 0,0,0,0,34, 2, 5, 1, 0,2,2,2,34, 3, 5, 2, 0,2
          ,2,2,34, 4, 5, 3, 0,2,2,2,34, 1, 5, 4, 0,2,2,2]
      }
},

"defaults":
{
  "bgcolor" : [0,0,0]

}

}
