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
        const [yearFact, mathFact, weatherData, eventsData] = await Promise.all([
            fetchYearFact(year),
            fetchMathFact(year),
            fetchWeather(year, month, day),
            fetchEvents(month, day)
        ]);

        // Save data for Quiz
        const sessionData = {
            yearFact,
            mathFact,
            weatherData,
            eventsData
        };
        sessionStorage.setItem('queryDayData', JSON.stringify(sessionData));

        renderDashboard({ yearFact, mathFact, weatherData, eventsData });
        initCanvas(year, eventsData);

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

async function fetchMathFact(year) {
    try {
        const res = await fetch(`http://numbersapi.com/${year}/math`);
        return await res.text();
    } catch (e) { return `${year} is a number with mysterious properties.`; }
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
        // Using Wikimedia REST API
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        // Return top 5 events
        return data.events ? data.events.slice(0, 5) : [];
    } catch (e) {
        console.warn("Wikimedia API failed, using fallback.");
        return [{ text: "Historical records are fragmented for this date." }];
    }
}

// Render Functions
function renderDashboard(data) {
    document.getElementById('year-fact').textContent = data.yearFact;
    document.getElementById('math-fact').textContent = data.mathFact;

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
        // Pick the first event
        const event = data.eventsData[0].text;
        eventsEl.textContent = event;
    } else {
        eventsEl.textContent = "No historical events found in the archives.";
    }
}

// Canvas Image Generator
function initCanvas(year, events) {
    const canvas = document.getElementById('fact-canvas');
    const ctx = canvas.getContext('2d');
    const btn = document.getElementById('download-btn');

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Generate Impact Phrase
    let eventText = "A quiet day in history.";
    if (events && events.length > 0) {
        // Try to find a short one
        const shortEvent = events.find(e => e.text.length < 100) || events[0];
        eventText = shortEvent.text;
    }
    const impactPhrase = `YEAR ${year}: ${eventText}`;

    // Load random image
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `https://picsum.photos/800/400?grayscale&blur=2`;

    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Overlay dark layer
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = "#64ffda";
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Text styles
        ctx.font = "bold 28px 'Orbitron'";
        ctx.fillStyle = "#64ffda";
        ctx.textAlign = "center";
        ctx.shadowColor = "#64ffda";
        ctx.shadowBlur = 10;

        // Wrap text
        wrapText(ctx, impactPhrase, canvas.width / 2, canvas.height / 2, 700, 40);

        // Add footer
        ctx.font = "16px 'Inter'";
        ctx.fillStyle = "#bd93f9";
        ctx.shadowBlur = 0;
        ctx.fillText("QueryDay Artifact", canvas.width - 100, canvas.height - 20);
    };

    btn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `chrono-artifact-${year}.png`;
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
