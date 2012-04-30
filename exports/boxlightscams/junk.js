"lights":
{

      "FDirect001": {
        "type": "directional",
        "intensity": 1,
        "direction": [0.0.-1],
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
        "color": [1 1 1],
        "position": [0, 0, 0],
        "direction": [0.0.-1],
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
        "fov": 0.602
      },
      "Camera002": {
        "type": "perspective",
        "position": [0, 0, 0],
        "fov": 0.602
      }
},

// OK
"objects":
{

    "Box001": {
      "position": [-14.966, -11.565, 0.000],
      "materials": ["wire"      ],
      "geometry": "Box001_geo",
      "visible": true
    }
},

// NOT OK
"materials":
{

      "01 - Default": {
        "diffuseColor": 1058444951,
        "ambientIntensity": 1.0,
        "specularColor": 0,
        "shininess": 0.145,
        "opacity": 1,
        "map" : "BARK5.jpg",
      }
    
},

// OK
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

      Box001_emb {
        "vertices" : [
          -61.905, -48.299, 0.000, 61.905, -48.299, 0.000, -61.905, 48.299, 0.000, 
          61.905, 48.299, 0.000, -61.905, -48.299, 55.782, 61.905, -48.299, 55.782, 
          -61.905, 48.299, 55.782, 61.905, 48.299, 55.782],
        "faces" : [
          2, 0, 2, 3, 2, 3, 1, 0, 2, 4, 5, 7, 2, 7, 6, 4, 2, 0, 1, 5, 
          2, 5, 4, 0, 2, 1, 3, 7, 2, 7, 5, 1, 2, 3, 2, 6, 2, 6, 7, 3, 
          2, 2, 0, 4, 2, 4, 6, 2]
        }
},
