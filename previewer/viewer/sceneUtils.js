SceneUtils = {};

SceneUtils.computeBoundingBox = function(scene)
{
	function compute(obj, boundingBox)
	{
		if (obj instanceof THREE.Mesh)
		{
			var geometry = obj.geometry;
			if (geometry)
			{
				if (!geometry.boundingBox)
				{
					geometry.computeBoundingBox();
				}
				
				var geometryBBox = geometry.boundingBox;
				
				if ( geometryBBox.min.x < boundingBox.min.x ) {

					boundingBox.min.x = geometryBBox.min.x;

				}
				
				if ( geometryBBox.max.x > boundingBox.max.x ) {

					boundingBox.max.x = geometryBBox.max.x;

				}

				if ( geometryBBox.min.y < boundingBox.min.y ) {

					boundingBox.min.y = geometryBBox.min.y;

				}
				
				if ( geometryBBox.max.y > boundingBox.max.y ) {

					boundingBox.max.y = geometryBBox.max.y;

				}

				if ( geometryBBox.min.z < boundingBox.min.z ) {

					boundingBox.min.z = geometryBBox.min.z;

				}
				
				if ( geometryBBox.max.z > boundingBox.max.z ) {

					boundingBox.max.z = geometryBBox.max.z;

				}
				
			}
		}
		else
		{
			var i, len = obj.children.length;
			for (i = 0; i < len; i++)
			{
				compute(obj.children[i], boundingBox);
			}
		}
	}
	
	var boundingBox = { min: new THREE.Vector3(), max: new THREE.Vector3() };
	
	compute(scene.root, boundingBox);
	
	return boundingBox;
}

