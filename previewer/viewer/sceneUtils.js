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
				var bboxMin = geometryBBox.min.clone();
				var bboxMax = geometryBBox.max.clone();
				var matrix = obj.matrixWorld;
				
				matrix.multiplyVector3(bboxMin);
				matrix.multiplyVector3(bboxMax);
				
				if ( bboxMin.x < boundingBox.min.x ) {

					boundingBox.min.x = bboxMin.x;

				}
				
				if ( bboxMax.x > boundingBox.max.x ) {

					boundingBox.max.x = bboxMax.x;

				}

				if ( bboxMin.y < boundingBox.min.y ) {

					boundingBox.min.y = bboxMin.y;

				}
				
				if ( bboxMax.y > boundingBox.max.y ) {

					boundingBox.max.y = bboxMax.y;

				}

				if ( bboxMin.z < boundingBox.min.z ) {

					boundingBox.min.z = bboxMin.z;

				}
				
				if ( bboxMax.z > boundingBox.max.z ) {

					boundingBox.max.z = bboxMax.z;

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
	
	compute(scene, boundingBox);
	
	return boundingBox;
}

