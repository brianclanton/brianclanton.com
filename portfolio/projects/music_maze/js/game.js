musicmaze.game = (function() {
	var GRID_LENGTH = 100;
	var GRID_WIDTH = 100;
	var WALL_HEIGHT = 100;

	var maze;

	var updating = true;

	var scene, camera, renderer;
	// var directionalLight;
	var container;
	var clock;
	var ground;

	var audioSource;
	var audioTextures;

	var controls;

	// Vertex shader for ground
	var groundVert = [
		"varying vec4 vertexPosition;",

		"void main() {",
			"vertexPosition = vec4(position, 1.0);",
			"gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;",
		"}"
	].join("\n");

	// Fragment shader for ground. Marks off start and end cell.
	var groundFrag = [
		"uniform vec2 mazeSize;",
		"uniform vec2 gridSize;",

		"varying vec4 vertexPosition;",

		THREE.ShaderChunk.fog_pars_fragment,

		"void main() {",
			"vec2 pos = vec2(-vertexPosition.x, vertexPosition.y) + mazeSize * gridSize / 2.0;",
			"if (pos.x < gridSize.x && pos.y < gridSize.y) {",
				"gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);",
			"} else if (pos.x > (mazeSize.x - 1.0) * gridSize.x && pos.y > (mazeSize.y - 1.0) * gridSize.y) {",
				"gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);",
			"} else {",
				"gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);",
			"}",

			THREE.ShaderChunk.fog_fragment,
		"}"
	].join("\n");

	var wallVert = [
		"varying vec4 vertexPosition;",

		"void main() {",
			"vertexPosition = vec4(position, 1.0);",
			"gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;",
		"}"
	].join("\n");

	var wallFrag = [
		"uniform float audioIsBeat;",
		"uniform float audioWasBeat;",

		"uniform float audioLevels[4];",
		"uniform float audioLevelsSmooth[4];",
		"uniform float audioLevelsChange[4];",

		"varying vec4 vertexPosition;",

		THREE.ShaderChunk.fog_pars_fragment,

		"void main() {",
			"if (audioLevelsChange[1] > 0.5)",
				"gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);",
			"else",
				"gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);",
			THREE.ShaderChunk.fog_fragment,
		"}"
	].join("\n");


	// Event listeners for stopping mouse controls and music when not in focus
	window.addEventListener("focus", function() {
		if (controls)
			controls.freeze = false;
	});

	window.addEventListener("blur", function() {
		if (controls)
			controls.freeze = true;
	});

 	// Initializes 3D scene
	function initialize(audio) {
		audioSource = audio;
		console.log(audioSource);

		clock = new THREE.Clock();

		container = document.createElement('div');
		document.body.appendChild(container);

		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0xD6F1FF, 0.0025);
		
		// scene.add(new THREE.AxisHelper());

		// directionalLight = new THREE.DirectionalLight(0xffffff);
		
		camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100000);
		// camera.position.x = -.5;
		// camera.position.y = .5;
		// camera.position.y = 20;
		// camera.position.z = 20;
		// camera.lookAt(new THREE.Vector3(-1, .5, .5), new THREE.Vector3(0, 0, 1));

		camera.rotation.x += Math.PI / 2;
		scene.add(camera);

		// controls = new THREE.TrackballControls( camera );
		// controls.rotateSpeed = 1.0;
		// controls.zoomSpeed = 1.2;
		// controls.panSpeed = 0.8;
		// controls.noZoom = false;
		// controls.noPan = true;

		controls = new THREE.FirstPersonControls(camera);
		controls.movementSpeed = 100;
		controls.lookSpeed = 0.2;
		controls.activeLook = false;
		controls.lookVertical = false;
		controls.noFly = true;

		renderer = new THREE.WebGLRenderer({
			antialias : true
		});
		renderer.setSize(window.innerWidth, window.innerHeight);

		audioTextures = new ThreeAudio.Textures(renderer, audioSource);

		// var testMesh = new THREE.Mesh(new THREE.CubeGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
		// scene.add(testMesh);

		// console.log(scene, testMesh);

		createScene();
		
		var startMarker = new THREE.Mesh(new THREE.SphereGeometry(.25), new THREE.MeshBasicMaterial({ color : 0xff0000 }));
		// startMarker.position = new THREE.Vector3(-maze.width / 2, -maze.length / 2, WALL_HEIGHT / 2);
		startMarker.position = new THREE.Vector3(-.5, .5, .5);
		scene.add(startMarker);

		container.appendChild(renderer.domElement);

		animate();
	}

	// Calls functions for ground and wall creation and resets camera position
	function createScene() {
		maze = musicmaze.maze;
		maze.width = maze.getWidth();
		maze.length = maze.getLength();
		// console.log(maze);

		camera.position.y = WALL_HEIGHT * .55;
		camera.position.x = -GRID_WIDTH / 2;
		camera.position.z = GRID_LENGTH / 2;

		createGround();
		createWalls();

		controls.freeze = false;
		updating = true;
	}

	// Creates ground
	function createGround() {
		// Draw ground
		ground = new THREE.Mesh(
			new THREE.PlaneGeometry(GRID_WIDTH * maze.width, GRID_LENGTH * maze.length), 
			new THREE.ShaderMaterial({ 
				side : THREE.DoubleSide,
				vertexShader : groundVert,
				fragmentShader : groundFrag,
				uniforms : THREE.UniformsUtils.merge([{
					mazeSize : { type : "v2", value : new THREE.Vector2(maze.width, maze.length) },
					gridSize : { type : "v2", value : new THREE.Vector2(GRID_WIDTH, GRID_LENGTH) }
				}, THREE.UniformsLib.fog]),
				fog : true
			})
		);
		ground.rotation.x = Math.PI / 2;
		ground.position = new THREE.Vector3(-maze.width * GRID_WIDTH / 2, 0, maze.length * GRID_LENGTH / 2);
		ground.material.uniforms.needsUpdate = true;

		scene.add(ground);
	}

	// Creates maze walls
	function createWalls() {
		var c = 0x0ff00;
		// var inc = (0x00ff00 - 0x006600) / (maze.width * maze.length);

		var totalWidth = GRID_WIDTH * maze.width;

		// var texture = new THREE.ImageUtils.loadTexture("textures/wall.jpg");
		var material = new ThreeAudio.Material(audioTextures, wallVert, wallFrag, null, THREE.UniformsLib.fog);
		material.side = THREE.DoubleSide;
		material.fog = true;
		// var material = new THREE.MeshBasicMaterial({ color : c, side : THREE.DoubleSide/*, map : texture*/ });

		for (var i = 0; i < maze.width; i++)
			for (var j = 0; j < maze.length; j++) {
				var cell = maze.getCellAt(i, j);
				if (j == 0) {
					var topWall = new THREE.Mesh(new THREE.PlaneGeometry(GRID_WIDTH, WALL_HEIGHT), material);
					topWall.rotation.z = Math.PI / 2;
					topWall.position.y += WALL_HEIGHT / 2;
					topWall.position.x = -GRID_WIDTH * (i + .5);
					topWall.position.z = GRID_LENGTH * j;
					topWall.isWall = true;
					
					cell.walls.push(topWall);
					scene.add(topWall);
				}
				if (cell.bottomWall) {
					var bottomWall = new THREE.Mesh(new THREE.PlaneGeometry(GRID_WIDTH, WALL_HEIGHT), material);
					bottomWall.rotation.z = Math.PI / 2;
					bottomWall.position.y += WALL_HEIGHT / 2;
					bottomWall.position.x = -GRID_WIDTH * (i + .5);
					bottomWall.position.z = GRID_LENGTH * (j + 1);
					bottomWall.isWall = true;
					
					cell.walls.push(bottomWall);
					if (i + 1 < maze.length)
						maze.getCellAt(i + 1, j).walls.push(bottomWall);

					scene.add(bottomWall);
				}
				if (cell.rightWall) {
					var rightWall = new THREE.Mesh(new THREE.PlaneGeometry(GRID_LENGTH, WALL_HEIGHT), material);
					rightWall.rotation.x = Math.PI / 2;
					rightWall.rotation.y = Math.PI / 2;
					rightWall.position.y += WALL_HEIGHT / 2;
					rightWall.position.x = -GRID_WIDTH * (i + 1);
					rightWall.position.z = GRID_LENGTH * (j + .5);
					rightWall.isWall = true;

					cell.walls.push(rightWall);
					if (j + 1 < maze.width)
						maze.getCellAt(i, j + 1).walls.push(rightWall);

					scene.add(rightWall);
				}
				if (i == 0) {
					var leftWall = new THREE.Mesh(new THREE.PlaneGeometry(GRID_LENGTH, WALL_HEIGHT), material);
					leftWall.rotation.x = Math.PI / 2;
					leftWall.rotation.y = Math.PI / 2;
					leftWall.position.y += WALL_HEIGHT / 2;
					leftWall.position.x = -GRID_WIDTH * i;
					leftWall.position.z = GRID_LENGTH * (j + .5);
					leftWall.isWall = true;

					cell.walls.push(leftWall);

					scene.add(leftWall);
				}
			}
	}

	// Removes maze walls to setup for next level
	function removeWalls() {
		var walls = scene.getDescendants().filter(function(element) {
			return element.isWall;
		});

		for (var i = 0; i < walls.length; i++)
			scene.remove(walls[i]);

		for (i = 0; i < maze.length; i++)
			for (var j = 0; j < maze.width; j++)
				maze.getCellAt(i, j).walls = [];

		scene.remove(ground);
	}

	function animate() {
		requestAnimationFrame(animate);
		if (updating) {
			audioTextures.update();
			console.log(audioSource.data.beat.is);
			render();
		}
	}

	// Updates WebGL renderer
	function render() {
		var delta = clock.getDelta();
		controls.update(delta);
		// if (upPressed)
		// 	camera.position.x -= .03;
		// if (downPressed)
		// 	camera.position.x += .03;
		// camera.rotation.x += .01;
		// console.log(camera.position.x, camera.position.y, camera.position.z);
		// directionalLight.position = camera.position;
		// directionalLight.rotation.y = camera.rotation.y;
		
		// console.log(camera.position.x, camera.position.z, camera.rotation.y);
		checkCollisions();
		checkWin();
		renderer.render(scene, camera);
		// console.log(camera.rotation.y);
	}

	// Performs collision detection with maze walls
	function checkCollisions() {
		// var bound = getCellLocation(
		// 	new THREE.Vector3(
		// 		GRID_WIDTH / 10 * Math.cos(camera.rotation.y),
		// 	 	0, 
		// 	 	GRID_LENGTH / 10 * Math.sin(camera.rotation.y)
		// 	).addSelf(camera.position).setY(0));

		// if (!currentLocation.equals(bound))
		// 	console.log(currentLocation.x, currentLocation.z, " || ", bound.x, bound.z);

		// console.log(currentLocation.x, currentLocation.z);

		// var x = Math.cos(camera.rotation.y);
		// var z = Math.sin(camera.rotation.y);
		// var currentLocation = getCellLocation(camera.position);
		// // console.log(currentLocation.x, currentLocation.z, x, z);

		// var vector = new THREE.Vector3(Math.cos(camera.rotation.y), 0, Math.sin(camera.rotation.y));
		// var ray = new THREE.Ray(controls.object.position, vector);
		// var intersects = ray.intersectObjects(maze.getCellAt(currentLocation.x, currentLocation.z).walls);

		// if (intersects.length != 0 && intersects[0].distance < GRID_WIDTH / 2) {
		// 	// // if (z > 0) {
		// 	// // 	// console.log("can't move left");
		// 	// // 	controls.moveLeft = false;
		// 	// // }
		// 	// // if (z < 0) {
		// 	// // 	// console.log("can't move right");
		// 	// // 	controls.moveRight = false;
		// 	// // }
		// 	// if (x > 0) {
		// 	// 	// console.log("can't move back");
		// 	// 	controls.moveForward = false;
		// 	// }
		// 	// if (x < 0) {
		// 	// 	// console.log("can't move forward");
		// 	// 	controls.moveBackward = false;
		// 	// }
		// 	// console.log("intersecting", intersects);
		// }
		// camera.position.z = Math.max()
	}

	// Get current cell location from vertex position
	function getCellLocation(pos) {
		return new THREE.Vector3(
			Math.floor(pos.x / -GRID_WIDTH),
			0,
			Math.floor(pos.z / GRID_LENGTH));
	}

	// Check if you have reached the exit cell
	function checkWin() {
		var currentLocation = getCellLocation(camera.position);
		if (currentLocation.x == maze.width - 1 && currentLocation.z == maze.length - 1) {
			// console.log("Level completed");
			controls.freeze = true;
			updating = false;

			// camera.position.y = WALL_HEIGHT * 3;
			// camera.lookAt(new THREE.Vector3(camera.position.x, 0, camera.position.z));

			removeWalls();
			musicmaze.settings.width += 2;
			musicmaze.settings.length += 2;

			$("#levelComplete").toggle("visible", function() {
				$("#yCont").click(goToNextLevel);
				$("#nCont").click(function() {
					audioSource.stop();
					$("#levelComplete").toggle("visible");
					$("#credits").toggle("visible");
				});
			});
		}
	}

	// Initiates next level
	function goToNextLevel() {
		$("#yCont").unbind("click", goToNextLevel);
		$("#levelComplete").toggle("visible", function() {
			maze.initialize();
			createScene();
		});		
	}

	return {
		initialize : initialize
	};
})();