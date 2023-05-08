const API_URL = "https://random-word-api.herokuapp.com/word";
const MAX_WRONG_GUESSES = 10;


const View = (() => {
    const domSelectors = {
        headerGuesses: ".header__guesses",
        wordLetters: ".word__letters",
        inputField: ".input",
        newGameBtn: ".new-game",
        guessHistoryLetters: ".guess-history__letters",
        headerTimer: ".header__timer",
    };

    const updateWrongGuessCount = (count) => {
        document.querySelector(domSelectors.headerGuesses).textContent = `${count} / ${MAX_WRONG_GUESSES}`;
    };

    const updateWordDisplay = (displayWord) => {
        const spacedWord = displayWord.split("").join(" ");
        document.querySelector(domSelectors.wordLetters).textContent = spacedWord;
    };

    const updateGuessHistoryDisplay = (correctLetters, incorrectLetters) => {
        const correctLetterSpans = correctLetters.map(letter => `<span class="correct-letter">${letter}</span>`).join("");
        const incorrectLetterSpans = incorrectLetters.map(letter => `<span class="incorrect-letter">${letter}</span>`).join("");
        document.querySelector(domSelectors.guessHistoryLetters).innerHTML = correctLetterSpans + incorrectLetterSpans;
    };

    const updateTimerDisplay = (timeRemaining) => {
        document.querySelector(domSelectors.headerTimer).textContent = `Time Left: ${timeRemaining}`;
    };

    return {
        domSelectors,
        updateWrongGuessCount,
        updateWordDisplay,
        updateGuessHistoryDisplay,
        updateTimerDisplay
    };
})();


const Model = ((apiUrl) => {
    class GameState {
        constructor() {
            this.word = "";
            this.displayWord = "";
            this.wrongGuessCount = 0;
            this.correctWordsCount = 0;
            this.hiddenIndexes = new Set();
            this.correctLetters = new Set();
            this.incorrectLetters = new Set();
        }

        async fetchNewWord() {
            try {
                const response = await fetch(apiUrl);
                const [newWord] = await response.json();
                this.word = newWord;
                console.log(this.word);
                this.hideLetters();
            } catch (error) {
                console.error("Error fetching new word:", error);
            }
        }

        hideLetters() {
            const wordLength = this.word.length;
            const hiddenLetterCount = Math.floor(Math.random() * wordLength) + 1;
            
            while (this.hiddenIndexes.size < hiddenLetterCount) {
                const index = Math.floor(Math.random() * wordLength);
                this.hiddenIndexes.add(index);
            }

            this.displayWord = this.word
                .split("")
                .map((letter, index) => (this.hiddenIndexes.has(index) ? "_" : letter))
                .join("");
        }

        guessLetter(letter) {
            if (this.correctLetters.has(letter) || this.incorrectLetters.has(letter)) {
                alert("You have already guessed this letter!");
                return false;
            }

            let isCorrect = false;
            for (const each of this.hiddenIndexes) {
                if (this.word[each] === letter) {
                    this.hiddenIndexes.delete(each);
                    isCorrect = true;
                } 
            } 

            if (isCorrect) {
                this.correctLetters.add(letter);
            } else {
                this.incorrectLetters.add(letter);
                this.wrongGuessCount++;
            }
            this.displayWord = this.word
                        .split("")
                        .map((letter, index) => (this.hiddenIndexes.has(index) ? "_" : letter))
                        .join("");

            return isCorrect;
        }

        reset() {
            this.word = "";
            this.displayWord = "";
            this.wrongGuessCount = 0;
            this.correctWordsCount = 0;
            this.hiddenIndexes = new Set();
            this.correctLetters = new Set();
            this.incorrectLetters = new Set();
        }
    }

    return {
        GameState,
    };
})(API_URL);


const Controller = ((view, model) => {
    const { domSelectors, updateWrongGuessCount, updateWordDisplay, updateGuessHistoryDisplay, updateTimerDisplay } = view;
    const { GameState } = model;

    const gameState = new GameState();

    const init = async () => {
        await gameState.fetchNewWord();
        updateWordDisplay(gameState.displayWord);
        updateWrongGuessCount(gameState.wrongGuessCount);
        domSelectors.inputField.value = "";
        updateGuessHistoryDisplay([...gameState.correctLetters], [...gameState.incorrectLetters]);
    };

    const inputGuessLetter = () => {
        document.querySelector(domSelectors.inputField).addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                const letter = event.target.value.toLowerCase();
                if (letter.length === 1 && letter.match(/[a-z]/i)) {
                    const isCorrect = gameState.guessLetter(letter); 
                    if (!isCorrect) {
                        updateWrongGuessCount(gameState.wrongGuessCount);
                    }
                    updateWordDisplay(gameState.displayWord);
                    updateGuessHistoryDisplay([...gameState.correctLetters], [...gameState.incorrectLetters]);
                    
                    if (gameState.wrongGuessCount > MAX_WRONG_GUESSES) {
                        gameState.reset();
                        await init();
                        startTimer();
                        alert(`Game over! You have guessed ${gameState.correctWordsCount} words!`);
                    } else if (!gameState.displayWord.includes("_")) {
                        gameState.correctWordsCount++;
                        gameState.correctLetters.clear();
                        gameState.incorrectLetters.clear();
                        await gameState.fetchNewWord();
                        updateWordDisplay(gameState.displayWord);
                        updateGuessHistoryDisplay([...gameState.correctLetters], [...gameState.incorrectLetters]);
                    }
                }
                event.target.value = "";
            }
        });
    };
    
    const newGamehandler = async () => {
        document.querySelector(domSelectors.newGameBtn).addEventListener("click", async () => {
            document.querySelector(domSelectors.inputField).value = "";
            gameState.reset();
            await init();  
            startTimer();
        });
    }

    let timer;
    const startTimer = () => {
        if (timer) {
            clearInterval(timer);
        }

        let timeRemaining = 60;
        updateTimerDisplay(timeRemaining);
        
        timer = setInterval(async () => {
            timeRemaining--;
            updateTimerDisplay(timeRemaining);

            if (timeRemaining <= 0) {
                gameState.reset();
                await init();
                startTimer();
                alert(`Time's used up! You have guessed ${gameState.correctWordsCount} words!`);
            }
        }, 1000);
    }

    const bootstrap = () => {
        init();
        inputGuessLetter();
        newGamehandler();
        startTimer();
    };
    
    return {
        bootstrap,
    };
})(View, Model);


Controller.bootstrap();
    