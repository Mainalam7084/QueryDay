const FUTURE_OUTCOMES = [
    { emoji: "💍", desc: "A partnership will define your next era." },
    { emoji: "✈️", desc: "New horizons await across the ocean." },
    { emoji: "💸", desc: "Fortune favors the bold, wealth is incoming." },
    { emoji: "💀", desc: "A transformation is necessary; let the old self die." },
    { emoji: "🚀", desc: "Your career will take a sudden upward trajectory." },
    { emoji: "🔮", desc: "Trust your intuition; the answers are within." },
    { emoji: "🏠", desc: "Stability and home will become your sanctuary." },
    { emoji: "🎨", desc: "Creativity will unlock a hidden door." },
    { emoji: "🏆", desc: "Victory is certain if you persist." },
    { emoji: "🌊", desc: "Go with the flow; resistance is futile." },
    { emoji: "🔑", desc: "You will find the solution to a long-standing problem." },
    { emoji: "❤️", desc: "Love will bloom in an unexpected place." },
    { emoji: "🌟", desc: "Fame or recognition is on the horizon." },
    { emoji: "📚", desc: "Knowledge will be your greatest weapon." },
    { emoji: "🧘", desc: "Inner peace will bring outer success." }
];

document.addEventListener('DOMContentLoaded', () => {
    const revealBtn = document.getElementById('reveal-btn');
    const cardsContainer = document.getElementById('cards-container');

    revealBtn.addEventListener('click', () => {
        // Hide button
        revealBtn.style.display = 'none';

        // Generate fortunes
        const fortunes = getRandomFortunes(3);

        // Render cards
        renderCards(fortunes);

        // Reveal animation sequence
        setTimeout(() => {
            const cards = document.querySelectorAll('.fortune-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('revealed');
                }, index * 600); // Staggered reveal
            });
        }, 100);
    });
});

function getRandomFortunes(count) {
    const shuffled = [...FUTURE_OUTCOMES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function renderCards(fortunes) {
    const container = document.getElementById('cards-container');
    container.innerHTML = ''; // Clear placeholders if any

    fortunes.forEach(fortune => {
        const card = document.createElement('div');
        card.className = 'fortune-card';
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">
                    <div class="emoji">${fortune.emoji}</div>
                    <p class="prediction-text">${fortune.desc}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
