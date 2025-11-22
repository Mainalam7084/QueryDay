document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('birth-form');
    const dayInput = document.getElementById('day');
    const monthInput = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const day = parseInt(dayInput.value);
        const month = parseInt(monthInput.value);
        const year = parseInt(yearInput.value);

        if (validateDate(day, month, year)) {
            // Save to Session Storage
            const birthDate = {
                day: day,
                month: month,
                year: year
            };
            sessionStorage.setItem('birthDate', JSON.stringify(birthDate));
            
            // Animation out effect (optional, handled via CSS transitions usually, but we just redirect here)
            document.querySelector('.container').style.opacity = '0';
            document.querySelector('.container').style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 500);
        } else {
            showError('Invalid Date. Please check your inputs.');
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

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.style.opacity = '1';
        setTimeout(() => {
            errorMsg.style.opacity = '0';
        }, 3000);
    }
});
