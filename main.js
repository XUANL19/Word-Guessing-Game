const API_URL = "https://random-word-api.herokuapp.com/word";
const MAX_WRONG_GUESSES = 10;


const View = (() => {
    const domSelectors = {
        headerGuesses: ".header__guesses",
        wordLetters: ".word__letters",
        inputField: ".input",
        newGameBtn: ".new-game",
    };

    const updateWrongGuessCount = (count) => {
        document.querySelector(domSelectors.headerGuesses).textContent = `${count} / ${MAX_WRONG_GUESSES}`;
    };

    const updateWordDisplay = (displayWord) => {
        const spacedWord = displayWord.split("").join(" ");
        document.querySelector(domSelectors.wordLetters).textContent = spacedWord;
    };

    return {
        domSelectors,
        updateWrongGuessCount,
        updateWordDisplay,
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
        }

        async fetchNewWord() {
            try {
                const response = await fetch(apiUrl);
                const [newWord] = await response.json();
                this.word = newWord;
                console.log(this.word);
                this.randomlyHideLetters();
            } catch (error) {
                console.error("Error fetching new word:", error);
            }
        }

        randomlyHideLetters() {
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
            let isCorrect = false;
            for (const each of this.hiddenIndexes) {
                if (this.word[each] === letter) {
                    this.hiddenIndexes.delete(each);
                    isCorrect = true;
                } else {
                    
                }
            } 
            if (!isCorrect) {
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
        }
    }

    return {
        GameState,
    };
})(API_URL);


const Controller = ((view, model) => {
    const { domSelectors, updateWrongGuessCount, updateWordDisplay } = view;
    const { GameState } = model;

    const gameState = new GameState();

    const init = async () => {
        await gameState.fetchNewWord();
        updateWordDisplay(gameState.displayWord);
        updateWrongGuessCount(gameState.wrongGuessCount);
        domSelectors.inputField.value = "";
    };

    const inputGuessLetter = () => {
        document.querySelector(domSelectors.inputField).addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                const letter = event.target.value.trim().toLowerCase();
                if (letter.length === 1 && letter.match(/[a-z]/i)) {
                    const isCorrect = gameState.guessLetter(letter);
                    updateWordDisplay(gameState.displayWord);
                    if (!isCorrect) {
                        updateWrongGuessCount(gameState.wrongGuessCount);
                    }

                    if (gameState.wrongGuessCount > MAX_WRONG_GUESSES) {
                        alert(`Game over! You have guessed ${gameState.correctWordsCount} words!`);
                        gameState.reset();
                        await init();
                    } else if (!gameState.displayWord.includes("_")) {
                        gameState.correctWordsCount++;
                        await gameState.fetchNewWord();
                        updateWordDisplay(gameState.displayWord);
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
        });
    }

    const bootstrap = () => {
        init();
        inputGuessLetter();
        newGamehandler();
    };
    
    return {
        bootstrap,
    };
})(View, Model);

Controller.bootstrap();
    