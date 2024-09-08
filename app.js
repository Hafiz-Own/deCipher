// Select boxes and loader elements
let boxes = document.querySelectorAll(".box");
let loader = document.querySelector(".loader");
let winModal = document.getElementById("winModal");
let loseModal = document.getElementById("loseModal");
let winReplayBtn = document.getElementById("winReplay");
let loseReplayBtn = document.getElementById("loseReplay");
let loseMsg = document.querySelector(".message");
let settingsIcon = document.querySelector(".settings-icon");
let dropdown = document.querySelector(".dropdown");
let themeToggle = document.getElementById("theme-toggle");
let wordSource = "wordOfDay"; // Default source
let theme = "light"; // Default theme
let invalidMsg = document.querySelector(".invalid");
let done = false; // Track if the game is over
let ans = ""; // Answer for the current game
let i = 0; // Index to track the current letter position
let word = ""; // Current word being formed
let nl = false; // Flag for new line detection
let header = document.querySelector(".header");

// Toggle dropdown visibility for settings
settingsIcon.addEventListener("click", () => {
    dropdown.classList.toggle("hide");
});

// Handle word source change
document.querySelectorAll("input[name='wordSource']").forEach(radio => {
    radio.addEventListener("change", function () {
        wordSource = this.value;
        replay();
        fetchWordOfDay();
    });
});

//Theme changer
themeToggle.addEventListener("click", () => {
    if (theme === "light") {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        header.classList.add("dark-theme");
        dropdown.classList.add("dark-theme");
        boxes.forEach(box => box.classList.add("dark-theme"));
        winModal.classList.add("dark-theme");
        loseModal.classList.add("dark-theme");
        theme = "dark";
    } else {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        header.classList.remove("dark-theme");
        dropdown.classList.remove("dark-theme");
        boxes.forEach(box => box.classList.remove("dark-theme"));
        winModal.classList.remove("dark-theme");
        loseModal.classList.remove("dark-theme");
        theme = "light";
    }
});


// Fetch the word of the day and initialize the answer
async function fetchWordOfDay() {
    let url = wordSource === "random"
        ? "https://words.dev-apis.com/word-of-the-day?random=1"
        : "https://words.dev-apis.com/word-of-the-day";

    loader.classList.remove("hide");
    let response = await fetch(url);
    let ansobj = await response.json();
    ans = ansobj.word.toUpperCase();
    loader.classList.add("hide");
}

// Initialize the game by fetching the word of the day
fetchWordOfDay();

// Helper function to initialize a letter count map
function initializeLetterCountMap(word) {
    let map = new Map();
    for (let letter of word) {
        map.set(letter, (map.get(letter) || 0) + 1);
    }
    return map;
}

// Add event listener for keyboard input
document.addEventListener("keydown", function (event) {
    // if (done || i === 30) return; // Exit if game is over or input limit reached

    let temp = event.key.toUpperCase();

    // Only allow alphabetic letters (A-Z)
    if (/^[A-Z]$/.test(temp)) {
        if (i % 5 === 0 && i !== 0 && nl === false) {
            // Handle case where line ends
            word = word.slice(0, -1) + temp;
            boxes[i - 1].classList.add("input-animation");
            boxes[i - 1].innerText = temp;
        } else {
            boxes[i].classList.add("input-animation");
            boxes[i++].innerText = temp;
            word += temp;
            nl = false;
        }
    }

    // Handle Enter and Backspace keys
    if (event.key === "Enter") {
        processGuess(); // Process the word when Enter is pressed
    }
    if (event.key === "Backspace") {
        handleBackspace(); // Handle backspace input
    }
});

// Handle backspace action
function handleBackspace() {
    if (word.length > 0) {
        word = word.slice(0, -1);
        boxes[--i].classList.remove("input-animation");
        boxes[i].innerText = "";
        nl = true;
    }
}

// Show win or lose modal
let showModal = (type) => {
    if (type === "win") {
        winModal.style.display = "flex";
        if (theme == "dark") {
            winModal.style.color = "black";
        }
    } else if (type === "lose") {
        if (theme == "dark") {
            loseModal.style.color = "black";
        }
        loseMsg.innerText = `Ouch! it was easy man, ${ans}`;
        loseModal.style.display = "flex";
    }
}

// Replay the game by resetting everything
let replay = () => {
    winModal.style.display = "none";
    loseModal.style.display = "none";
    i = 0;
    word = "";
    done = false;
    boxes.forEach(box => {
        box.innerText = "";
        box.classList.remove("win", "close", "wrong", "warning");
    });
    fetchWordOfDay(); // Re-fetch the word of the day for replay
}

// Process the word when Enter is pressed
async function processGuess() {
    if (i % 5 === 0 && i !== 0) {
        loader.classList.remove("hide");
        let res = await fetch("https://words.dev-apis.com/validate-word", {
            method: "POST",
            body: JSON.stringify({ word: word })
        })
        let resobj = await res.json();
        let valid = resobj.validWord;
        if (!valid) {
            loader.classList.add("hide");;
            invalidMsg.innerText = "not a valid word"
            invalidMsg.classList.add("slide");
            for (let c = i - 5; c < i; c++) {
                boxes[c].classList.remove("input-animation");
                boxes[c].classList.add("warning");
            }
            console.log("returning");
            setTimeout(() => {
                invalidMsg.innerText = ""
                invalidMsg.classList.remove("slide");
            }, 3000);
            return;
        }
        loader.classList.add("hide");

        loader.classList.remove("hide");

        let ansLetterCountMap = initializeLetterCountMap(ans); // Initialize the answer letter count map
        let allRight = true; // Track if all letters are correct

        // First pass: Mark correct letters (green)
        for (let j = 0; j < 5; j++) {
            if (word[j] === ans[j]) {
                boxes[j + (i - 5)].classList.add("win"); // Mark as correct
                ansLetterCountMap.set(word[j], ansLetterCountMap.get(word[j]) - 1); // Decrease count in map
            }
        }

        // Second pass: Mark close (yellow) or wrong letters
        for (let j = 0; j < 5; j++) {
            if (word[j] !== ans[j]) {
                if (ansLetterCountMap.get(word[j]) > 0) {
                    boxes[j + (i - 5)].classList.add("close"); // Mark as close
                    ansLetterCountMap.set(word[j], ansLetterCountMap.get(word[j]) - 1); // Decrease count in map
                    allRight = false;
                } else {
                    boxes[j + (i - 5)].classList.add("wrong"); // Mark as wrong
                    allRight = false;
                }
            }
        }

        word = ""; // Reset the word
        nl = true; // Set new line flag

        if (allRight) {
            done = true; // Game won
            showModal("win");
            return;
        }
        else if (i === 30) { // Game over after 6 rounds (5 letters each)
            done = true;
            showModal("lose");
            return;
        }

        // If the guess was incorrect, apply warning animation to the previous row
        for (let c = i - 5; c < i; c++) {
            boxes[c].classList.remove("input-animation");
            boxes[c].classList.add("warning");
        }

        loader.classList.add("hide"); // Hide loader after processing
    }
}

// Add event listeners to replay buttons
winReplayBtn.addEventListener("click", replay);
loseReplayBtn.addEventListener("click", replay);
