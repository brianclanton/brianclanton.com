portfolio = function() {
	var portfolioPieces;

	function renderPage(name) {
		// Check session storage for JSON portfolio pieces
		if (!sessionStorage.portfolioPieces) {
			$.getJSON("/portfolio/portfolio_pieces.json", function(data) {
				sessionStorage.setItem("portfolioPieces", JSON.stringify(data));

				setupPage(name);
			});
		} else {
			setupPage(name);
		}
	}

	function setupPage(name) {
		portfolioPieces = JSON.parse(sessionStorage.getItem("portfolioPieces"));

		$("#content").html(Mustache.render($("#portfolioTemplate").html(), portfolioPieces[name]));
		$("a[href='/portfolio/?name=" + name + "']").parent().addClass("active");
	}

	return  {
		renderPage : renderPage
	};
}();