// About this app: I was very interested in WikiArena by Fabian Fischer, and
// wanted to recreate his game in the browser, using only vanilla JavaScript.
// I have almost all of the same features in this game, excluding the skip
// button, and tracking the total number of wins. Thanks for checking out my
// project! - Andrew

let viewsDate;
let articleOneViews;
let articleTwoViews;
let articleOneLength;
let articleTwoLength;
let score = 0;
let lives = 3;
const gameOverSound = new Audio('resources/gameover.wav');
const gameWonSound = new Audio('resources/gamewon.wav');
const rightSound = new Audio('resources/right.wav');
const wrongSound = new Audio('resources/wrong.wav');
// Puts any dynamic content onto the page when it is loaded
async function buildPage() {
	// When loading the page, two articles are shown as a preview
	// Create a variable of today's date to generate the first article on the intro screen
	let today = new Date();
	let dd = String(today.getDate()).padStart(2,"0");
	let mm = String(today.getMonth() + 1).padStart(2,"0");
	let yyyy = today.getFullYear().toString();
	// Create a variable roughly one month ago to count article views from and generate the second article on the intro screen
	viewsDate = new Date();
	let viewsDD = String(viewsDate.getDate()).padStart(2,"0");
	if (viewsDD > 28) {viewsDD = 28;};
	let viewsMM = String(viewsDate.getMonth() + 1).padStart(2,"0");
	if (viewsMM === "01") {viewsMM = "12";}
	else {viewsMM = String(viewsDate.getMonth()).padStart(2,"0");}
	let viewsYYYY = viewsDate.getFullYear().toString();
	viewsDate = viewsYYYY + viewsMM + viewsDD + "00";
	// The first article displayed on the intro screen is today's featured article from Wikipedia. 
	let previewTodayURL = "https://api.wikimedia.org/feed/v1/wikipedia/en/featured/" + yyyy + "/" + mm + "/" + dd;
	let previewTodayReq = await fetch(previewTodayURL);
	let previewTodayJson = await previewTodayReq.json();
	let previewTodayTitle = previewTodayJson.tfa.titles.normalized;
	let previewTodayText = previewTodayJson.tfa.extract;
	let previewTodayImage = previewTodayJson.tfa.originalimage.source;
	// The second article displayed on the intro screen is the featured article from roughly one month ago (I reuse the date variable that is used to calculate pageviews)
	let previewMonthURL = "https://api.wikimedia.org/feed/v1/wikipedia/en/featured/" + viewsYYYY + "/" + viewsMM + "/" + viewsDD;
	let previewMonthReq = await fetch(previewMonthURL);
	let previewMonthJson = await previewMonthReq.json();
	let previewMonthTitle = previewMonthJson.tfa.titles.normalized;
	let previewMonthText = previewMonthJson.tfa.extract;
	let previewMonthImage = previewMonthJson.tfa.originalimage.source;
	// Display the two preview articles (if an article doesn't have a main image, the Wikipedia logo will be displayed instead)
	if (previewTodayImage === "https://commons.wikimedia.org/wiki/Special:FilePath/undefined") {previewTodayImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Wikipedia-logo-transparent.png/526px-Wikipedia-logo-transparent.png"}
	document.getElementById("article-one-img").src = previewTodayImage;
	document.getElementById("article-one-title").innerHTML = previewTodayTitle;
	document.getElementById("article-one-text").innerHTML = previewTodayText;
	if (previewMonthImage === "https://commons.wikimedia.org/wiki/Special:FilePath/undefined") {previewMonthImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Wikipedia-logo-transparent.png/526px-Wikipedia-logo-transparent.png"}
	document.getElementById("article-two-img").src = previewMonthImage;
	document.getElementById("article-two-title").innerHTML = previewMonthTitle;
	document.getElementById("article-two-text").innerHTML = previewMonthText;
}
// This function will run every time "Next Round" or "New Game" is clicked
async function newRound() {
	// Generate two random Wikipedia articles. The article title and ID are stored as variables, both to display and to use in future API calls for this round.
	let queryRandom = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", list: "random", rnnamespace: "0", rnlimit: "2", format: "json", formatversion: "2"});
	let queryRandomReq = await fetch(queryRandom);
	let queryRandomJson = await queryRandomReq.json();
	let articleOneTitle = queryRandomJson.query.random[0].title;
	let articleTwoTitle = queryRandomJson.query.random[1].title;
	// Get the main image of each article and store the link to the image using Wikipedia's FilePath URL
	let queryImages = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", titles: articleOneTitle, prop: "pageimages", format: "json", formatversion: "2",});
	let imagesReq = await fetch(queryImages);
	let imagesJson = await imagesReq.json();
	let articleOneImage = "https://commons.wikimedia.org/wiki/Special:FilePath/" + imagesJson.query.pages[0].pageimage;
	// This can be done for both articles in a single API call, but since there's no way to make sure the queries are returned in a consistent order, I have to make a separate call for each article
	queryImages = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", titles: articleTwoTitle, prop: "pageimages", format: "json", formatversion: "2"});
	imagesReq = await fetch(queryImages);
	imagesJson = await imagesReq.json();
	let articleTwoImage = "https://commons.wikimedia.org/wiki/Special:FilePath/" +  imagesJson.query.pages[0].pageimage;
	// Get the number of views within the past month for earch article
	let viewsURL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/" + articleOneTitle + "/monthly/" + viewsDate + "/2222022200";
	let viewsReq = await fetch(viewsURL);
	let viewsJson = await viewsReq.json();
	articleOneViews = viewsJson.items[0].views;
	// Same situation as before, so a second API call for article two
	viewsURL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/" + articleTwoTitle + "/monthly/" + viewsDate + "/2222022200";
	viewsReq = await fetch(viewsURL);
	viewsJson = await viewsReq.json();
	articleTwoViews = viewsJson.items[0].views;
	// Extracting the intro text for each article
	let extractText = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", prop: "extracts", exintro: "true", explaintext: "true", exsentences: "3", format: "json", formatversion: "2", titles: articleOneTitle});
	let extractTextReq = await fetch(extractText);
	let extractTextJson = await extractTextReq.json();
	let articleOneText = extractTextJson.query.pages[0].extract;
	// Extracting again, but this time extracting the whole article and splitting it into individual words in order to calculate the article length
	extractText = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", prop: "extracts", explaintext: "true", format: "json", formatversion: "2", titles: articleOneTitle});
	extractTextReq = await fetch(extractText);
	extractTextJson = await extractTextReq.json();
	let articleOneFullExtract = extractTextJson.query.pages[0].extract;
	articleOneLength = articleOneFullExtract.split(" ");
	articleOneLength = articleOneLength.length;
	// Extracting intro text for article two
	extractTextURL = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", prop: "extracts", exintro: "true", explaintext: "true", exsentences: "3", format: "json", formatversion: "2", titles: articleTwoTitle});
	extractTextReq = await fetch(extractTextURL);
	extractTextJson = await extractTextReq.json();
	let articleTwoText = extractTextJson.query.pages[0].extract;
	// Getting article length for article two
	extractText = "https://en.wikipedia.org/w/api.php?" + new URLSearchParams({origin: "*", action: "query", prop: "extracts", explaintext: "true", format: "json", formatversion: "2", titles: articleTwoTitle});
	extractTextReq = await fetch(extractText);
	extractTextJson = await extractTextReq.json();
	let articleTwoFullExtract = extractTextJson.query.pages[0].extract;
	articleTwoLength = articleTwoFullExtract.split(" ");
	articleTwoLength = articleTwoLength.length;
	// Putting all the gathered information on the screen (except views and length), again substituting an undefined image link for the Wikipedia logo
	if (articleOneImage === "https://commons.wikimedia.org/wiki/Special:FilePath/undefined") {articleOneImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Wikipedia-logo-transparent.png/526px-Wikipedia-logo-transparent.png"}
	document.getElementById("article-one-img").src = articleOneImage;
	document.getElementById("article-one-title").innerHTML = articleOneTitle;
	document.getElementById("article-one-text").innerHTML = articleOneText;
	if (articleTwoImage === "https://commons.wikimedia.org/wiki/Special:FilePath/undefined") {articleTwoImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Wikipedia-logo-transparent.png/526px-Wikipedia-logo-transparent.png"};
	document.getElementById("article-two-img").src = articleTwoImage;
	document.getElementById("article-two-title").innerHTML = articleTwoTitle;
	document.getElementById("article-two-text").innerHTML = articleTwoText;
	// Remove the game info and create the game controls
	if (lives === 3) {
		document.getElementById("first-life").src = "resources/redheart.png"
		document.getElementById("second-life").src = "resources/redheart.png"
		document.getElementById("third-life").src = "resources/redheart.png"
	}
	document.getElementById("advance-button").classList.add("inactive");
	document.getElementById("advance-button").onclick = "";
	document.getElementById("score").innerText = score;
	document.getElementById("advance-button").innerText = "Next Round";
	document.getElementById("game-info").innerHTML = "";
	document.getElementById("controls-container").innerHTML = '<br><button id="northwest" onClick="choseNW()"><img src="resources/memo.png">Longer</button><button id="northeast" onClick="choseNE()">Longer<img src="resources/memo.png"></button><br><button id="southwest" onClick="choseSW()"><img src="resources/eye.png">More views</button><button id="southeast" onClick="choseSE()">More views<img src="resources/eye.png"></button>'
}
// These functions run after guessing, one for each option chosen
function choseNW() {
	if (articleOneLength > articleTwoLength) {score++; rightSound.play()}
	else if (articleOneLength < articleTwoLength) {
		lives--;
		removeLife();
		wrongSound.play()
	};
	if (score === 10) {
		winGame();
	} else {
	revealStats();
	endRound();
	}
}
function choseNE() {
	if (articleTwoLength > articleOneLength) {score++; rightSound.play()}
	else if (articleTwoLength < articleOneLength) {
		lives--;
		removeLife();
		wrongSound.play()
	};
	if (score === 10) {
		winGame();
	} else {
	revealStats();
	endRound();
	}
}
function choseSW() {
	if (articleOneViews > articleTwoViews) {score++; rightSound.play()}
	else if (articleOneViews < articleTwoViews) {
		lives--;
		removeLife();
		wrongSound.play()
	};
	if (score === 10) {
		winGame();
	} else {
	revealStats();
	endRound();
	}
}
function choseSE() {
	if (articleTwoViews > articleOneViews) {score++; rightSound.play()}
	else if (articleTwoViews < articleOneViews) {
		lives--;
		removeLife();
		wrongSound.play()
	};
	if (score === 10) {
		winGame();
	} else {
	revealStats();
	endRound();
	}
}
// When losing a life, this turns one of the hearts black
function removeLife() {
	if (lives === 2) {document.getElementById("first-life").src = "resources/blackheart.png"}
	else if (lives === 1) {document.getElementById("second-life").src = "resources/blackheart.png"}
	else if (lives === 0) {document.getElementById("third-life").src = "resources/blackheart.png"}
}
function revealStats() {
	document.getElementById("controls-container").innerHTML += '<div id="reveal-length"><p><span id="left-length">' + articleOneLength + ' words</span><span id="right-length">' + articleTwoLength + ' words</span></p></div><br><div id="reveal-views"><p><span id="left-views">' + articleOneViews + ' views</span><span id="right-views">' + articleTwoViews + ' views</span></p></div>'
}
function winGame() {
	document.getElementById("score").innerText = "10";
	revealStats();
	gameWonSound.play();
	endRound();
	gameOver();
}
function gameOver() {
	document.getElementById("advance-button").innerText = "New Game";
	if (score != 10) {gameOverSound.play();}
	score = 0;
	lives = 3;
}
// All guessing functions point to this, which checks if the game is over and prepares for the next round or game
function endRound() {
	// Disable all buttons until 
	document.getElementById("advance-button").classList.remove("inactive");
	document.getElementById("advance-button").onclick = function() {newRound()};
	document.getElementById("advance-button").innerText = "Next Round";
	document.getElementById("northwest").onclick = "";
	document.getElementById("northwest").classList.add("inactive");
	document.getElementById("northeast").onclick = "";
	document.getElementById("northeast").classList.add("inactive");
	document.getElementById("southwest").onclick = "";
	document.getElementById("southwest").classList.add("inactive");
	document.getElementById("southeast").onclick = "";
	document.getElementById("southeast").classList.add("inactive");
	document.getElementById("score").innerHTML = score;
	if (lives === 0) {gameOver();}
}