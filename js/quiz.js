document.addEventListener('DOMContentLoaded', () => {
    const birthDate = JSON.parse(sessionStorage.getItem('birthDate'));
    const sessionData = JSON.parse(sessionStorage.getItem('queryDayData'));

    if (!birthDate || !sessionData) {
        alert("Temporal data missing. Returning to origin.");
        window.location.href = 'main.html';
        return;
    }

    const questions = generateQuestions(birthDate, sessionData);
    let currentQuestionIndex = 0;
    let score = 0;

    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const progressEl = document.getElementById('progress');
    const quizApp = document.getElementById('question-area');
    const resultArea = document.getElementById('result-area');
    const finalScoreEl = document.getElementById('final-score');
    const scoreMsgEl = document.getElementById('score-message');

    function showQuestion() {
        const q = questions[currentQuestionIndex];
        questionEl.textContent = q.question;
        optionsEl.innerHTML = '';

        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => handleAnswer(index, q.correctIndex);
            optionsEl.appendChild(btn);
        });

        // Update progress
        const progress = ((currentQuestionIndex) / questions.length) * 100;
        progressEl.style.width = `${progress}%`;
    }

    function handleAnswer(selectedIndex, correctIndex) {
        const btns = document.querySelectorAll('.option-btn');
        btns.forEach(b => b.disabled = true);

        if (selectedIndex === correctIndex) {
            btns[selectedIndex].classList.add('correct');
            score++;
        } else {
            btns[selectedIndex].classList.add('wrong');
            btns[correctIndex].classList.add('correct');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                showQuestion();
            } else {
                showResults();
            }
        }, 1500);
    }

    function showResults() {
        quizApp.style.display = 'none';
        resultArea.style.display = 'block';
        progressEl.style.width = '100%';

        finalScoreEl.textContent = `${score} / ${questions.length}`;

        if (score >= 8) {
            scoreMsgEl.textContent = "You are a true Time Lord!";
        } else if (score >= 5) {
            scoreMsgEl.textContent = "Not bad, Time Traveler.";
        } else {
            scoreMsgEl.textContent = "The timeline is confusing, isn't it?";
        }
    }

    showQuestion();
});

function generateQuestions(birthDate, data) {
    const q = [];
    const { day, month, year } = birthDate;
    const { weatherData, eventsData } = data;

    // 1. Year
    q.push({
        question: "What is your origin year?",
        options: shuffle([year, year - 1, year + 1, year + 10]),
        correctIndex: 0 // We will shuffle options and find index later, but for now let's just shuffle the array and find the value.
    });

    // 2. Month
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    q.push({
        question: "What is your origin month?",
        options: shuffle([months[month - 1], months[(month + 2) % 12], months[(month + 5) % 12], months[(month + 8) % 12]]),
        correctIndex: -1 // Placeholder
    });

    // 3. Day
    q.push({
        question: "What is your origin day?",
        options: shuffle([day, (day + 5) % 30 + 1, (day + 10) % 30 + 1, (day + 15) % 30 + 1]),
        correctIndex: -1
    });

    // 4. Future Year
    q.push({
        question: `If you travel 50 years into the future from your origin, what year is it?`,
        options: shuffle([year + 50, year + 25, year + 100, year + 10]),
        correctIndex: -1
    });

    // 5. Past Year
    q.push({
        question: `If you travel 20 years into the past from your origin, what year is it?`,
        options: shuffle([year - 20, year - 10, year - 30, year - 5]),
        correctIndex: -1
    });

    // 6. Weather Max
    if (weatherData) {
        const correct = weatherData.maxTemp;
        q.push({
            question: `What was the max temperature in London on your origin date?`,
            options: shuffle([`${correct}°C`, `${(correct + 5).toFixed(1)}°C`, `${(correct - 5).toFixed(1)}°C`, `${(correct + 10).toFixed(1)}°C`]),
            correctIndex: -1
        });
    } else {
        q.push({
            question: "Is time travel theoretically possible?",
            options: shuffle(["Yes", "No", "Maybe", "Only forward"]),
            correctIndex: -1 // "Yes" is usually the fun answer
        });
    }

    // 7. Weather Rain
    if (weatherData) {
        const rained = weatherData.precip > 0;
        q.push({
            question: `Did it rain in London on your origin date?`,
            options: ["Yes", "No"],
            correctIndex: rained ? 0 : 1
        });
    } else {
        q.push({
            question: "What is the fourth dimension?",
            options: shuffle(["Time", "Space", "Gravity", "Love"]),
            correctIndex: -1
        });
    }

    // 8. Event
    if (eventsData && eventsData.length > 0) {
        const correctEvent = eventsData[0].text.substring(0, 50) + "...";
        q.push({
            question: "Which event happened on your birthday in history?",
            options: shuffle([correctEvent, "The internet was invented.", "Humans landed on Mars.", "The Great Wall of China was completed."]),
            correctIndex: -1
        });
    } else {
        q.push({
            question: "Who wrote 'The Time Machine'?",
            options: shuffle(["H.G. Wells", "Jules Verne", "Isaac Asimov", "Stephen Hawking"]),
            correctIndex: -1
        });
    }

    // 9. Math/Year Logic
    const age = new Date().getFullYear() - year;
    q.push({
        question: `How many years have passed since your origin (as of ${new Date().getFullYear()})?`,
        options: shuffle([age, age - 1, age + 1, age + 5]),
        correctIndex: -1
    });

    // 10. Fun
    q.push({
        question: "What is the speed of light?",
        options: shuffle(["299,792 km/s", "100,000 km/s", "1,000 km/s", "Infinite"]),
        correctIndex: -1
    });

    // Fix correct indices
    return q.map(item => {
        // If correctIndex is -1, we need to find the correct answer in options
        // But wait, I shuffled options before knowing which was correct.
        // I need to pass the correct value separately or track it.

        // Let's refactor slightly:
        // The first item in the options array passed to shuffle was the correct one (mostly).
        // Except for Rain (fixed) and Weather Max (first one).

        // Actually, my shuffle function shuffles in place or returns new.
        // I need to know WHICH one is correct.

        // Let's assume the FIRST option in the list provided to shuffle WAS the correct one.
        // So I need to find where it went.

        // But wait, for "Rain", I didn't shuffle.

        // Let's redo the object structure to be safer.
        return item;
    });
}

// Helper to shuffle and track correct answer
function shuffle(array) {
    // We assume the first element is the correct one.
    const correctValue = array[0];
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled;
}

// Redefining generateQuestions to be robust
function generateQuestions(birthDate, data) {
    const { day, month, year } = birthDate;
    const { weatherData, eventsData } = data;
    const qList = [];

    // Helper to create a question object
    const createQ = (text, correct, wrongs) => {
        const allOpts = [correct, ...wrongs];
        const shuffled = allOpts.sort(() => Math.random() - 0.5);
        return {
            question: text,
            options: shuffled,
            correctIndex: shuffled.indexOf(correct)
        };
    };

    // 1. Year
    qList.push(createQ("What is your origin year?", year, [year - 1, year + 1, year + 10]));

    // 2. Month
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    qList.push(createQ("What is your origin month?", months[month - 1], [months[(month + 2) % 12], months[(month + 5) % 12], months[(month + 8) % 12]]));

    // 3. Day
    qList.push(createQ("What is your origin day?", day, [(day + 5) % 30 + 1, (day + 10) % 30 + 1, (day + 15) % 30 + 1]));

    // 4. Future
    qList.push(createQ(`If you travel 50 years into the future from ${year}, what year is it?`, year + 50, [year + 25, year + 100, year + 10]));

    // 5. Past
    qList.push(createQ(`If you travel 20 years into the past from ${year}, what year is it?`, year - 20, [year - 10, year - 30, year - 5]));

    // 6. Weather Max
    if (weatherData) {
        const correct = weatherData.maxTemp + "°C";
        qList.push(createQ("What was the max temperature in London on your origin date?", correct, [(weatherData.maxTemp + 5).toFixed(1) + "°C", (weatherData.maxTemp - 5).toFixed(1) + "°C", (weatherData.maxTemp + 2).toFixed(1) + "°C"]));
    } else {
        qList.push(createQ("Is time travel theoretically possible?", "Yes", ["No", "Maybe", "Only backwards"]));
    }

    // 7. Weather Rain
    if (weatherData) {
        const rained = weatherData.precip > 0;
        qList.push(createQ("Did it rain in London on your origin date?", rained ? "Yes" : "No", [rained ? "No" : "Yes"]));
    } else {
        qList.push(createQ("What is the fourth dimension?", "Time", ["Space", "Gravity", "Love"]));
    }

    // 8. Event
    if (eventsData && eventsData.length > 0) {
        const correctEvent = eventsData[0].text.length > 60 ? eventsData[0].text.substring(0, 60) + "..." : eventsData[0].text;
        qList.push(createQ("Which event happened on your birthday in history?", correctEvent, ["The internet was invented.", "Humans landed on Mars.", "The Great Wall of China was completed."]));
    } else {
        qList.push(createQ("Who wrote 'The Time Machine'?", "H.G. Wells", ["Jules Verne", "Isaac Asimov", "Stephen Hawking"]));
    }

    // 9. Age
    const age = new Date().getFullYear() - year;
    qList.push(createQ(`How many years have passed since your origin (as of ${new Date().getFullYear()})?`, age, [age - 1, age + 1, age + 5]));

    // 10. Fun
    qList.push(createQ("What is the speed of light?", "299,792 km/s", ["100,000 km/s", "1,000 km/s", "Infinite"]));

    return qList;
}
