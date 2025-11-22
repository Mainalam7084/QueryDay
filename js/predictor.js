const FUTURE_OUTCOMES = [
    "You will invent a new color that only you can see.",
    "A stray cat will lead you to a hidden treasure.",
    "You will accidentally become the mayor of a small town.",
    "Your left shoe will always be slightly tighter than your right.",
    "You will discover a new species of deep-sea creature in your bathtub.",
    "Aliens will contact you, but only to ask for WiFi passwords.",
    "You will win a lottery, but the prize is 10,000 rubber ducks.",
    "A time traveler will ask you for directions to the nearest coffee shop.",
    "You will become famous for a dance move you did while sneezing.",
    "Your plants will start whispering secrets to you.",
    "You will find a key that opens every door, but locks none.",
    "A cloud will follow you around, raining only on your enemies.",
    "You will write a bestseller without typing a single word.",
    "Your reflection will start giving you fashion advice.",
    "You will be the first person to high-five a ghost.",
    "A squirrel will challenge you to a game of chess and win.",
    "You will discover that you can speak fluent Dolphin.",
    "Your shadow will detach and start its own career.",
    "You will bake a cake so delicious it brings world peace.",
    "You will accidentally join a secret society of mimes."
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
                }, index * 500); // Staggered reveal
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
                    <p>${fortune}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
