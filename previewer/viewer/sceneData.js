/**
 * @author Tony Parisi / http://www.tonyparisi.com
 */

//Custom Scene data class
SceneData = function()
{
	Sim.Object.call(this);
}

SceneData.prototype = new Sim.Object();

SceneData.prototype.init = function(param)
{
	var group = new THREE.Object3D;

	var that = this;

	var url = param.url || "";
	if (!url)
		return;

	var scale = param.scale || 1;
	this.scale = new THREE.Vector3(scale, scale, scale);
	
	var loader = new THREE.SceneLoader();
	loader.load( url, function( data ) { 
		that.handleLoaded(data) } );

    // Tell the framework about our object
    this.setObject3D(group);
}


SceneData.prototype.handleLoaded = function(data)
{
	this.object3D.add(data.scene);
	
	this.object3D.scale.copy(this.scale);
	
//	var themesh = data.scene.children[0];
//	var material = new THREE.MeshBasicMaterial( {color:themesh.material.color.getHex(), map: themesh.material.map});
//	themesh.material = material;
//	var mesh = new THREE.Mesh(themesh.geometry, material);
//	this.object3D.add(mesh);
	
	if (this.onLoadComplete)
	{
		this.onLoadComplete(this);
	}
}


