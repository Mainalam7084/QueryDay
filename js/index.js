document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('birth-form');
    const dayInput = document.getElementById('day');
    const monthInput = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const cityInput = document.getElementById('city');
    const errorMsg = document.getElementById('error-msg');
    const submitBtn = document.querySelector('.launch-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const day = parseInt(dayInput.value);
        const month = parseInt(monthInput.value);
        const year = parseInt(yearInput.value);
        const city = cityInput.value.trim();

        if (!validateDate(day, month, year)) {
            showError('Invalid Date. Please check your inputs.');
            return;
        }

        if (!city) {
            showError('Please enter a city.');
            return;
        }

        // Disable button and show loading state
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = "Locating...";
        submitBtn.disabled = true;

        try {
            const coords = await getCoordinates(city);
            if (!coords) {
                showError(`Could not locate "${city}". Please try a major city.`);
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Save to Session Storage as requested
            sessionStorage.setItem('birthDay', day);
            sessionStorage.setItem('birthMonth', month);
            sessionStorage.setItem('birthYear', year);
            sessionStorage.setItem('originCity', city); // Saving city name too for display
            sessionStorage.setItem('originLatitude', coords.lat);
            sessionStorage.setItem('originLongitude', coords.lon);

            // Also keeping the object for backward compatibility if needed, but main request was specific keys.
            // We will stick to the specific keys for the new logic.
            const birthDate = { day, month, year };
            sessionStorage.setItem('birthDate', JSON.stringify(birthDate));

            // Animation out effect
            document.querySelector('.container').style.opacity = '0';
            document.querySelector('.container').style.transform = 'scale(1.1)';

            setTimeout(() => {
                window.location.href = 'main.html';
            }, 500);

        } catch (err) {
            console.error(err);
            showError('Error connecting to geocoding service.');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    function validateDate(day, month, year) {
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return false;
        if (month < 1 || month > 12) return false;

        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) return false;

        return true;
    }

    async function getCoordinates(city) {
        // Using Nominatim API (OpenStreetMap)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Geocoding failed');
        const data = await res.json();

        if (data && data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon
            };
        }
        return null;
    }

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.opacity = '1';
        setTimeout(() => {
            errorMsg.style.opacity = '0';
        }, 3000);
    }
});
