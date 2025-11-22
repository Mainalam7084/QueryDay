document.addEventListener('DOMContentLoaded', async () => {
    const stateJson = localStorage.getItem('CHRONO_STATE');
    if (!stateJson) {
        window.location.href = '../index.html';
        return;
    }

    const CHRONO_STATE = JSON.parse(stateJson);
    const { year, month, day } = CHRONO_STATE.date;

    document.getElementById('display-date').textContent = `${month}/${day}/${year}`;
    const loadingOverlay = document.getElementById('loading-overlay');

    try {
        let techData = CHRONO_STATE.facts.tech;

        if (!techData) {
            console.log("Fetching Tech/World Data...");
            const [popData, scienceData] = await Promise.all([
                fetchPopulation(year),
                fetchScience(year)
            ]);

            techData = { popData, scienceData };
            CHRONO_STATE.facts.tech = techData;
            localStorage.setItem('CHRONO_STATE', JSON.stringify(CHRONO_STATE));
        } else {
            console.log("Loading Tech/World Data from Cache...");
        }

        renderTech(techData);

    } catch (error) {
        console.error("Error in Tech Module:", error);
    } finally {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 500);
    }
});

async function fetchPopulation(year) {
    try {
        // World Bank API
        const url = `https://api.worldbank.org/v2/country/WLD/indicator/SP.POP.TOTL?date=${year}&format=json`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('World Bank API Error');

        const data = await res.json();
        // Structure: [ {page: 1, ...}, [ {indicator:..., value: 12345, ...} ] ]
        if (data && data.length > 1 && data[1] && data[1].length > 0) {
            const val = data[1][0].value;
            if (val) {
                // Format number
                return new Intl.NumberFormat('en-US').format(val);
            }
        }
        throw new Error('No population data found');

    } catch (e) {
        console.warn("Population fetch failed:", e);
        return "Global census data unavailable for this era.";
    }
}

async function fetchScience(year) {
    try {
        // Nobel Prize API - Physics as a proxy for "Tech/Science"
        const url = `https://api.nobelprize.org/v1/prize.json?year=${year}&category=physics`;
        const res = await fetch(url);

        if (!res.ok) throw new Error('Nobel API Error');

        const data = await res.json();
        if (data.prizes && data.prizes.length > 0) {
            const prize = data.prizes[0];
            const laureates = prize.laureates.map(l => `${l.firstname} ${l.surname || ''}`).join(", ");
            return `Nobel Prize in Physics: Awarded to ${laureates} for their contribution to science.`;
        }
        return `No Physics Nobel Prize was awarded in ${year}, or records are incomplete.`;

    } catch (e) {
        console.warn("Science fetch failed:", e);
        return "Scientific milestones for this cycle are encrypted.";
    }
}

function renderTech(data) {
    document.getElementById('pop-fact').textContent = `Estimated World Population: ${data.popData}`;
    document.getElementById('tech-fact').textContent = data.scienceData;
}
