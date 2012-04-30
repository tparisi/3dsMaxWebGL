// Constructor
SceneViewer = function()
{
	Sim.App.call(this);
}

// Subclass Sim.App
SceneViewer.prototype = new Sim.App();

// Our custom initializer
SceneViewer.prototype.init = function(param)
{
	// Call superclass init code to set up scene, renderer, default camera
	Sim.App.prototype.init.call(this, param);
	
    // Create a headlight to show off the model
	this.headlight = new THREE.DirectionalLight( 0xffffff, 1);
	this.headlight.position.set(0, 0, 1);
	this.scene.add(this.headlight);	

	this.camera.position.set(0, 3, 10);	

	this.camera.lookAt(this.root.position);
	this.createGrid();
	this.createCameraControls();
}

SceneViewer.prototype.addContent = function(content)
{	
//	content.object3D.rotation.x = -Math.PI / 2;
	this.root.add(content.object3D);	
}

SceneViewer.prototype.createGrid = function()
{
	var line_material = new THREE.LineBasicMaterial( { color: 0xaaaaaa, opacity: 0.8 } ),
		geometry = new THREE.Geometry(),
		floor = 0, step = 1, size = 66;
	
	for ( var i = 0; i <= size / step * 2; i ++ )
	{
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - size, floor, i * step - size ) ) );
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3(   size, floor, i * step - size ) ) );
	
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor, -size ) ) );
		geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor,  size ) ) );
	}
	
	var grid = new THREE.Line( geometry, line_material, THREE.LinePieces );

	this.root.add(grid);
}

SceneViewer.prototype.createCameraControls = function()
{
	var controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
	var radius = SceneViewer.CAMERA_RADIUS;
	
	controls.rotateSpeed = SceneViewer.ROTATE_SPEED;
	controls.zoomSpeed = SceneViewer.ZOOM_SPEED;
	controls.panSpeed = SceneViewer.PAN_SPEED;
	controls.dynamicDampingFactor = SceneViewer.DAMPING_FACTOR;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = false;

	controls.minDistance = radius * SceneViewer.MIN_DISTANCE_FACTOR;
	controls.maxDistance = radius * SceneViewer.MAX_DISTANCE_FACTOR;

	this.controls = controls;
}


SceneViewer.prototype.update = function()
{
	// Update the camera controls
	if (this.controls)
	{
		this.controls.update();
	}
	
	// Update the headlight to point at the model
	var normcamerapos = this.camera.position.clone().normalize();
	this.headlight.position.copy(normcamerapos);

	Sim.App.prototype.update.call(this);
}

SceneViewer.CAMERA_RADIUS = 10;
SceneViewer.MIN_DISTANCE_FACTOR = 1.1;
SceneViewer.MAX_DISTANCE_FACTOR = 10;
SceneViewer.ROTATE_SPEED = 1.0;
SceneViewer.ZOOM_SPEED = 3;
SceneViewer.PAN_SPEED = 0.2;
SceneViewer.DAMPING_FACTOR = 0.3;
