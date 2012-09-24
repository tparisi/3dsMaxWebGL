/**
 * @author Tony Parisi / http://www.tonyparisi.com
 */

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

	param = param || {};
	
    // Create a headlight to show off the model
	this.headlight = new THREE.DirectionalLight( 0xffffff, 1);
	this.headlight.position.set(0, 0, 1);
	this.scene.add(this.headlight);	

	this.camera.position.set(0, 3, 10);	
	this.camera.lookAt(this.root.position);

	this.gridSize = param.gridSize || SceneViewer.DEFAULT_GRID_SIZE;
	this.gridStepSize = param.gridStepSize || SceneViewer.DEFAULT_GRID_STEP_SIZE;	
	
	this.createGrid();
	this.createCameraControls();
}

SceneViewer.prototype.addContent = function(content)
{	
//	content.object3D.rotation.x = -Math.PI / 2;
	if (this.content)
	{
		this.root.remove(this.content.object3D);
	}
	
	this.root.add(content.object3D);
	this.fitToScene();
	this.content = content;
	
}

SceneViewer.prototype.createGrid = function()
{
	if (this.grid)
	{
		this.root.remove(this.grid);
	}
	
	var line_material = new THREE.LineBasicMaterial( { color: 0xaaaaaa, opacity: 0.8 } ),
		geometry = new THREE.Geometry(),
		floor = 0, step = this.gridStepSize, size = this.gridSize;
	
	for ( var i = 0; i <= size / step * 2; i ++ )
	{
		geometry.vertices.push( new THREE.Vector3( - size, floor, i * step - size ) );
		geometry.vertices.push( new THREE.Vector3(   size, floor, i * step - size ) );
	
		geometry.vertices.push( new THREE.Vector3( i * step - size, floor, -size ) );
		geometry.vertices.push( new THREE.Vector3( i * step - size, floor,  size ) );
	}
	
	this.grid = new THREE.Line( geometry, line_material, THREE.LinePieces );

	this.root.add(this.grid);
}

SceneViewer.prototype.createCameraControls = function()
{
	var controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
	var radius = this.sceneRadius ? this.sceneRadius  : SceneViewer.CAMERA_RADIUS;
	
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

SceneViewer.prototype.fitToScene = function()
{
	function log10(val) {
		  return Math.log(val) / Math.LN10;
		}

	this.boundingBox = SceneUtils.computeBoundingBox(this);
	
	var extent = this.boundingBox.max.clone().subSelf(this.boundingBox.min);
	
	this.sceneRadius = extent.length();
	
	var scope = Math.pow(10, Math.ceil(log10(this.sceneRadius)));
	
	this.gridSize = scope;
	this.gridStepSize = scope / 100;

	this.createGrid();
	this.createCameraControls();
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
SceneViewer.MIN_DISTANCE_FACTOR = 1.5;
SceneViewer.MAX_DISTANCE_FACTOR = 15;
SceneViewer.ROTATE_SPEED = 1.0;
SceneViewer.ZOOM_SPEED = 3;
SceneViewer.PAN_SPEED = 0.2;
SceneViewer.DAMPING_FACTOR = 0.3;
SceneViewer.DEFAULT_GRID_SIZE = 100;
SceneViewer.DEFAULT_GRID_STEP_SIZE = 1;
