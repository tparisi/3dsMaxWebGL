/**
 * @author Tony Parisi / http://www.tonyparisi.com
 */

SceneViewer = function()
{
	SB.Game.call(this);	    		
}

goog.inherits(SceneViewer, SB.Game);

SceneViewer.prototype.initialize = function(param)
{
	if (!param)
		param = {};
	
	SB.Game.prototype.initialize.call(this, param);
	
	this.gridSize = param.gridSize || SceneViewer.DEFAULT_GRID_SIZE;
	this.gridStepSize = param.gridStepSize || SceneViewer.DEFAULT_GRID_STEP_SIZE;	
	
	this.initEntities();
}


SceneViewer.prototype.initEntities = function()
{
	this.root = new SB.Entity;

	this.sceneRoot = new SB.Entity;
	this.sceneRoot.addComponent(new SB.Transform);
	
	this.root.addChild(this.sceneRoot);	
	
	var viewer = SB.Prefabs.FPSController({ headlight : true });
	
	var controllerScript = viewer.getComponent(SB.FPSControllerScript);
	this.controllerScript = controllerScript;
	this.controllerScript.setCameraPos(new THREE.Vector3(0, 2.5, 10));
	
	this.root.addChild(viewer);
	
	this.createGrid();

	this.jsonScene = null;
	
	this.addEntity(this.root);
	
	this.root.realize();
}

SceneViewer.prototype.replaceScene = function(jsonScene)
{	
	if (this.jsonScene)
	{
		this.sceneRoot.removeComponent(this.jsonScene);
	}
	
	this.sceneRoot.addComponent(jsonScene);
	this.fitToScene();
	this.jsonScene = jsonScene;
	
}

SceneViewer.prototype.createGrid = function()
{
	if (this.grid)
	{
		this.root.removeComponent(this.grid);
	}
		
	this.grid = new SB.Grid({color: 0x202020, size: this.gridSize, stepSize: this.gridStepSize});

	this.root.addComponent(this.grid);
}

SceneViewer.prototype.fitToScene = function()
{
	function log10(val) {
		  return Math.log(val) / Math.LN10;
		}

	this.boundingBox = SB.SceneUtils.computeBoundingBox(this.sceneRoot.transform.object);
	
	var extent = this.boundingBox.max.clone().subSelf(this.boundingBox.min);
	
	this.sceneRadius = extent.length();
	
	var scope = Math.pow(10, Math.ceil(log10(this.sceneRadius)));
	
	this.gridSize = scope;
	this.gridStepSize = scope / 100;

	var cx = (this.boundingBox.max.x + this.boundingBox.min.x) / 2;
	var cy = (this.boundingBox.max.y + this.boundingBox.min.y) / 2;
	var cz = (this.boundingBox.max.z + this.boundingBox.min.z) / 2;

	var x = cx;
	var y = cy + 1.6; //  + this.boundingBox.min.y;
	var z = this.boundingBox.max.z + 10;
	
	this.controllerScript.setCameraPos(new THREE.Vector3(cx, y, this.sceneRadius));
	this.controllerScript.setCameraTurn(new THREE.Vector3);
	this.controllerScript.setCameraTilt(new THREE.Vector3);
	this.controllerScript.walkSpeed = this.gridStepSize;	
	
	this.createGrid();
}

SceneViewer.DEFAULT_GRID_SIZE = 100;
SceneViewer.DEFAULT_GRID_STEP_SIZE = 1;
