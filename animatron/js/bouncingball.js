window.addEventListener("load", function() {
	// Variable declaration
	var b = Builder._$;
	var C = anm.C;
	var animationPlaying = false;

	// Constants
	const WIDTH = 640, HEIGHT = 480;

	// Ball attributes
	var vx = (Math.random() * 50 + 25) * (Math.random() > .5 ? 1 : -1), vy = -Math.random() * 50 + 100;
	var posX = 0, posY = 0;
	var radius = 30;
	var dampingFactor = .9;
	var gravity = 5;

	function bounce(t) {
		// Euler's Method gravity simulation
		vy += t * gravity;

		posX += vx * t;
		posY += vy * t;

		this.x = posX;
		this.y = posY;
		// console.log(this.x, this.y);

		// Collision detection with walls

		// Check top or bottom wall
		if (posY - radius < 0 || posY + radius > HEIGHT) {
			// console.log(posX, posY, "top or bot");
			// console.log("top or bot", posY - radius < 0, posY + radius > HEIGHT);
			// Bump ball position to within boundaries
			posY = posY < HEIGHT / 2 ? 0 + radius : HEIGHT - radius; 
			// Reverse y-component of velocity and apply artifical damping factor
			vy *= -dampingFactor;
			// Apply artifical damping factor to x-component of velocity
			vx *= dampingFactor;
		}
		// Check left or right wall
		if (posX - radius < 0 || posX + radius > WIDTH) {
			// console.log(posX, posY, "right or left");
			// console.log("left or right", posX - radius < 0, posX + radius > WIDTH);
			// Bump ball position to within boundaries
			posX = posX < WIDTH / 2 ? 0 + radius : WIDTH - radius;
			// Reverse x-component of velocity and apply artificial damping factor
			vx *= -dampingFactor;
			// Apply artificial damping factor to y-component of velocity
			vy *= dampingFactor;
		}

		// Deformation
	}

	var scene = b()
		.circle([posX, posY], radius)
		.fill('#009')
		.stroke('#f00', 3)
		.modify(bounce);
	createPlayer('sceneCanvas', { 
		"mode" : C.M_DYNAMIC,
		// "repeat" : true,
		"anim" : {
			"width" : WIDTH,
			"height" : HEIGHT,
			"bgfill" : { color : "#006600" }
		} 
	})
		.load(scene)
		.play();
});