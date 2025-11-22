document.addEventListener('DOMContentLoaded', async () => {
    const birthDateData = sessionStorage.getItem('birthDate');
    if (!birthDateData) {
        window.location.href = 'index.html';
        return;
    }

    const { day, month, year } = JSON.parse(birthDateData);
    document.getElementById('display-date').textContent = `${month}/${day}/${year}`;

    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');

    try {
        const [yearFact, dateFact, weatherData, eventsData] = await Promise.all([
            fetchYearFact(year),
            fetchDateFact(month, day),
            fetchWeather(year, month, day),
            fetchEvents(month, day)
        ]);

        renderDashboard({ yearFact, dateFact, weatherData, eventsData });
        initQuiz({ yearFact, dateFact, eventsData });
        initCanvas(yearFact);

    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Some data streams failed to synchronize. Proceeding with available data.");
    } finally {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 500);
    }
});

// API Functions
async function fetchYearFact(year) {
    try {
        const res = await fetch(`http://numbersapi.com/${year}/year`);
        return await res.text();
    } catch (e) { return `In ${year}, the timeline was fuzzy.`; }
}

async function fetchDateFact(month, day) {
    try {
        const res = await fetch(`http://numbersapi.com/${month}/${day}/date`);
        return await res.text();
    } catch (e) { return `On ${month}/${day}, nothing notable was recorded in this sector.`; }
}

async function fetchWeather(year, month, day) {
    try {
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=51.5&longitude=0.1&start_date=${formattedDate}&end_date=${formattedDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FLondon`);
        const data = await res.json();
        if (data.daily) {
            return {
                maxTemp: data.daily.temperature_2m_max[0],
                minTemp: data.daily.temperature_2m_min[0],
                precip: data.daily.precipitation_sum[0]
            };
        }
        return null;
    } catch (e) { return null; }
}

async function fetchEvents(month, day) {
    try {
        // Using a CORS proxy or alternative if ZenQuotes blocks. 
        // ZenQuotes often blocks client-side. Trying history.muffinlabs.com as a robust fallback if ZenQuotes fails or using it directly as it's more open.
        // Prompt asked for ZenQuotes. I will try it. If it fails, I'll return a generic message or use a fallback.
        // Note: ZenQuotes free tier is often limited.
        // Let's try to fetch from ZenQuotes.
        const res = await fetch(`https://today.zenquotes.io/api/${month}/${day}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        return data.data ? data.data.Events : [];
    } catch (e) {
        console.warn("ZenQuotes failed, trying fallback...");
        // Fallback to a hardcoded list or another source if possible, or just return empty.
        // For the sake of the assignment, we handle the error gracefully.
        return ["Historical data stream interrupted."];
    }
}

// Render Functions
function renderDashboard(data) {
    document.getElementById('year-fact').textContent = data.yearFact;
    document.getElementById('date-fact').textContent = data.dateFact;

    const weatherEl = document.getElementById('weather-data');
    if (data.weatherData) {
        weatherEl.innerHTML = `
            Max Temp: ${data.weatherData.maxTemp}°C<br>
            Min Temp: ${data.weatherData.minTemp}°C<br>
            Precipitation: ${data.weatherData.precip}mm
        `;
    } else {
        weatherEl.textContent = "Atmospheric data unavailable for this coordinate.";
    }

    const eventsEl = document.getElementById('events-data');
    if (Array.isArray(data.eventsData) && data.eventsData.length > 0) {
        // Pick a random event or first few
        const event = typeof data.eventsData[0] === 'string' ? data.eventsData[0] : data.eventsData[0].text;
        eventsEl.textContent = event;
    } else {
        eventsEl.textContent = "No historical events found in the archives.";
    }
}

// Quiz Logic
function initQuiz(data) {
    const quizContainer = document.getElementById('quiz-container');
    // Generate a simple question based on the Year Fact
    // Extract a number from the year fact if possible, or just ask "What year...?"

    // Let's make a question about the birth year.
    const birthYear = JSON.parse(sessionStorage.getItem('birthDate')).year;
    const question = `Which year is your origin year?`;
    const correctAnswer = birthYear;

    // Generate wrong answers
    const wrong1 = birthYear - Math.floor(Math.random() * 5) - 1;
    const wrong2 = birthYear + Math.floor(Math.random() * 5) + 1;
    const options = [correctAnswer, wrong1, wrong2].sort(() => Math.random() - 0.5);

    let html = `<h3>Chrono-Quiz</h3><p>${question}</p><div class="quiz-options">`;
    options.forEach(opt => {
        html += `<button class="quiz-btn" onclick="checkAnswer(this, ${opt === correctAnswer})">${opt}</button>`;
    });
    html += `</div><p id="quiz-result"></p>`;

    quizContainer.innerHTML = html;
}

window.checkAnswer = function (btn, isCorrect) {
    const result = document.getElementById('quiz-result');
    if (isCorrect) {
        btn.classList.add('correct');
        result.textContent = "Correct! Timeline verified.";
        result.style.color = "#00ff00";
    } else {
        btn.classList.add('wrong');
        result.textContent = "Incorrect. Temporal anomaly detected.";
        result.style.color = "#ff0000";
    }
    // Disable all buttons
    const btns = document.querySelectorAll('.quiz-btn');
    btns.forEach(b => b.disabled = true);
};

// Canvas Image Generator
function initCanvas(text) {
    const canvas = document.getElementById('fact-canvas');
    const ctx = canvas.getContext('2d');
    const btn = document.getElementById('download-btn');

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Load random image
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `https://picsum.photos/800/400?grayscale&blur=2`;

    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Overlay dark layer
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text styles
        ctx.font = "bold 24px 'Courier New'";
        ctx.fillStyle = "#00f3ff";
        ctx.textAlign = "center";

        // Wrap text
        wrapText(ctx, text, canvas.width / 2, canvas.height / 2, 700, 30);
    };

    btn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'chrono-fact.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    let startY = y - ((lines.length - 1) * lineHeight) / 2;

    for (let k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k], x, startY + (k * lineHeight));
    }
}
