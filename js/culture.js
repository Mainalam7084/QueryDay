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
        let cultureData = CHRONO_STATE.facts.culture;

        if (!cultureData) {
            console.log("Fetching Culture Data...");
            const [movieData, musicData] = await Promise.all([
                fetchMovie(year),
                fetchMusic(year)
            ]);

            cultureData = { movieData, musicData };
            CHRONO_STATE.facts.culture = cultureData;
            localStorage.setItem('CHRONO_STATE', JSON.stringify(CHRONO_STATE));
        } else {
            console.log("Loading Culture Data from Cache...");
        }

        renderCulture(cultureData);

    } catch (error) {
        console.error("Error in Culture Module:", error);
    } finally {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 500);
    }
});

async function fetchMovie(year) {
    try {
        // Using a placeholder API key. In a real scenario, this should be replaced.
        // We implement a graceful fallback if it fails (which it will without a valid key).
        const apiKey = 'THEMOVIEDB_API_KEY';
        const url = `https://api.themoviedb.org/3/discover/movie?primary_release_year=${year}&sort_by=popularity.desc&api_key=${apiKey}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('TMDB API access denied or failed');

        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const movie = data.results[0];
            return {
                title: movie.title,
                overview: movie.overview,
                poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
            };
        }
        throw new Error('No movies found for this year');

    } catch (e) {
        console.warn("Movie fetch failed, using fallback:", e);
        return {
            title: `Cinema of ${year}`,
            overview: "The visual archives for this sector are corrupted. However, it is known that moving pictures were a dominant art form.",
            poster: null
        };
    }
}

async function fetchMusic(year) {
    try {
        // Using MusicBrainz as a stable, key-less alternative for music data
        // Spotify requires OAuth which is not feasible here without a backend.
        const url = `https://musicbrainz.org/ws/2/release?query=date:${year}&fmt=json&limit=1`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('MusicBrainz API failed');

        const data = await res.json();
        if (data.releases && data.releases.length > 0) {
            const release = data.releases[0];
            const artist = release['artist-credit']?.[0]?.name || "Unknown Artist";
            return {
                album: release.title,
                artist: artist
            };
        }
        throw new Error('No music found');

    } catch (e) {
        console.warn("Music fetch failed, using fallback:", e);
        return {
            album: `Audio Logs of ${year}`,
            artist: "Various Artists"
        };
    }
}

function renderCulture(data) {
    const movieEl = document.getElementById('movie-fact');
    const movieImg = document.getElementById('movie-poster');

    movieEl.innerHTML = `<strong>${data.movieData.title}</strong><br>${data.movieData.overview}`;
    if (data.movieData.poster) {
        movieImg.src = data.movieData.poster;
        movieImg.style.display = 'block';
    }

    const musicEl = document.getElementById('music-fact');
    musicEl.innerHTML = `Top Release: <strong>${data.musicData.album}</strong> by ${data.musicData.artist}`;
}
