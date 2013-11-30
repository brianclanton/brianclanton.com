var musicmaze = {
	settings : {
		length : 3,
		width : 3
	}
};

// start loading when main document is loaded
window.addEventListener("load", function() {
	Modernizr.load([{
		load : [
			// Libraries
			"lib/jquery.min.js", "lib/three.min.js", "lib/FirstPersonControls.js", "lib/ThreeAudio.min.js",
			// Scripts
			"js/maze.js", "js/game.js"
		],

		complete : function() {
			console.log("All files have been loaded.");
			var audioSource;

			function init() {
				musicmaze.maze.initialize();
				musicmaze.game.initialize(audioSource);
			}

			function startGame() {
				window.removeEventListener("click", startGame);
				$("#welcome").toggle("visible", function() {
					audioSource =
						(new ThreeAudio.Source()).load(
							"/audio/Freaks and Geeks.mp3",
							init
						).play();
				});
			}

			$("#welcome").toggle("visible", function() {
				window.addEventListener("click", startGame);				
			});
		}
	}]);
}, false);