document.addEventListener('DOMContentLoaded', async () => {
    // Retrieve CHRONO_STATE from localStorage
    const stateJson = localStorage.getItem('CHRONO_STATE');

    if (!stateJson) {
        window.location.href = '../index.html';
        return;
    }

    const CHRONO_STATE = JSON.parse(stateJson);
    const { year, month, day } = CHRONO_STATE.date;
    const { city, lat, lon } = CHRONO_STATE.location;

    document.getElementById('display-date').textContent = `${month}/${day}/${year}`;

    // Show loading
    const loadingOverlay = document.getElementById('loading-overlay');

    try {
        let coreData = CHRONO_STATE.facts.core;

        if (!coreData) {
            console.log("Fetching Core Data...");
            const [bookFact, numberFact, weatherData, eventsData] = await Promise.all([
                fetchYearBookFact(year),
                fetchYearNumberFact(year),
                fetchWeather(year, month, day, lat, lon),
                fetchEvents(month, day)
            ]);

            coreData = {
                bookFact,
                numberFact,
                weatherData,
                eventsData,
                city
            };

            // Update State
            CHRONO_STATE.facts.core = coreData;
            localStorage.setItem('CHRONO_STATE', JSON.stringify(CHRONO_STATE));
        } else {
            console.log("Loading Core Data from Cache...");
        }

        renderDashboard(coreData);
        initCanvas(year, coreData.eventsData);

    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Some data streams failed to synchronize. Proceeding with available data.");
    } finally {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 500);
    }
});

// API Functions
async function fetchYearBookFact(year) {
    if (!year || isNaN(year)) {
        return "ERROR: Coordenadas de tiempo insuficientes.";
    }

    try {
        // Search for books first published in that year, sorted by rating to get "notable" ones
        const url = `https://openlibrary.org/search.json?q=first_publish_year:${year}&sort=rating&limit=1`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`OpenLibrary API Error: ${res.status}`);
        }

        const data = await res.json();

        if (data.docs && data.docs.length > 0) {
            const book = data.docs[0];
            const title = book.title;
            const author = book.author_name ? book.author_name[0] : "Autor Desconocido";
            return `El libro más notable de este año fue '${title}' por ${author}.`;
        }

        return `El archivo cultural del año ${year} está cifrado, pero fue una época importante para la literatura.`;

    } catch (e) {
        console.error("Error fetching book fact:", e);
        return `El archivo cultural del año ${year} está cifrado, pero fue una época importante para la literatura.`;
    }
}

async function fetchYearNumberFact(year) {
    if (!year || isNaN(year)) {
        return "ERROR: Datos numéricos inestables.";
    }

    try {
        // Search for total count of books published in that year
        const url = `https://openlibrary.org/search.json?q=first_publish_year:${year}&limit=1`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`OpenLibrary API Error: ${res.status}`);
        }
        const data = await res.json();
        const numFound = data.numFound || 0;

        return `El número ${year} se asocia a la publicación de ${numFound} archivos culturales importantes.`;
    } catch (e) {
        console.error("Error fetching number fact:", e);
        return `El número de origen ${year} oculta un valor que no pudimos descifrar.`;
    }
}

async function fetchWeather(year, month, day, lat, lon) {
    try {
        // Default to London if no coords (fallback)
        const latitude = lat || 51.5;
        const longitude = lon || 0.1;

        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${formattedDate}&end_date=${formattedDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
        const data = await res.json();
        if (data.daily) {
            return {
                maxTemp: data.daily.temperature_2m_max[0],
                minTemp: data.daily.temperature_2m_min[0],
                precip: data.daily.precipitation_sum[0]
            };
        }
        return null;
    } catch (e) {
        console.error("Weather fetch error", e);
        return null;
    }
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
    document.getElementById('year-fact').textContent = data.bookFact;
    document.getElementById('math-fact').textContent = data.numberFact;

    const weatherEl = document.getElementById('weather-data');
    // Update Weather Title with City
    const weatherCardTitle = weatherEl.parentElement.querySelector('h2');
    if (weatherCardTitle) {
        weatherCardTitle.textContent = `Historical Weather (${data.city})`;
    }

    if (data.weatherData) {
        weatherEl.innerHTML = `
            Max Temp: ${data.weatherData.maxTemp}°C<br>
            Min Temp: ${data.weatherData.minTemp}°C<br>
            Precipitation: ${data.weatherData.precip}mm
        `;
    } else {
        weatherEl.textContent = "Atmospheric data unavailable for this coordinate/date.";
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

        // Overlay dark layer with scanlines
        ctx.fillStyle = "rgba(5, 5, 16, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scanline effect
        ctx.fillStyle = "rgba(0, 229, 255, 0.05)";
        for (let i = 0; i < canvas.height; i += 4) {
            ctx.fillRect(0, i, canvas.width, 2);
        }

        // Border
        ctx.strokeStyle = "#00e5ff";
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Text styles - Anime Title Style
        ctx.font = "bold 32px 'Orbitron'";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 20;

        // Wrap text
        wrapText(ctx, impactPhrase, canvas.width / 2, canvas.height / 2, 700, 45);

        // Add footer
        ctx.font = "14px 'Orbitron'";
        ctx.fillStyle = "#ffcc00";
        ctx.shadowBlur = 0;
        ctx.fillText("CHRONO_ARCHIVE // QUERYDAY", canvas.width - 150, canvas.height - 20);
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
