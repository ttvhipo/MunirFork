
function handleError(message, error) {
    console.error(message, error);
    alert(message);
}

// Function to fetch the API key from the configuration file
async function getApiKey() {
    try {
        const response = await fetch('apis/config.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const config = await response.json();
        return config.apiKey;
    } catch (error) {
        handleError('Failed to fetch API key.', error);
        return null;
    }
}


function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}


async function displaySearchSuggestions(results) {
    const searchSuggestions = document.getElementById('searchSuggestions');

    if (results.length === 0) {
        searchSuggestions.innerHTML = '<div class="p-2 text-gray-500">No suggestions available</div>';
        searchSuggestions.classList.remove('hidden');
        return;
    }

    const suggestionsHTML = results.map(media => {
        const mediaTypeLabel = media.media_type === 'movie' ? 'Movie' : 'TV Show';
        const mediaTitle = media.title || media.name;
        const mediaRating = media.vote_average ? media.vote_average.toFixed(1) : 'N/A';

        return `
            <div class="suggestion-item p-4 hover:bg-zinc-700 cursor-pointer rounded-lg transition-transform transform hover:scale-105" data-id="${media.id}" data-type="${media.media_type}">
                <div class="flex items-center">
                    <img src="https://image.tmdb.org/t/p/w45${media.poster_path}" alt="${mediaTitle}" class="w-16 h-24 object-cover rounded-md mr-4">
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-white truncate">${mediaTitle}</h4>
                        <p class="text-gray-400 text-sm">${mediaTypeLabel}</p>
                        <p class="text-yellow-400 text-sm">${mediaRating}/10</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    searchSuggestions.innerHTML = suggestionsHTML;
    searchSuggestions.classList.remove('hidden');

    searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', async () => {
            const mediaId = item.getAttribute('data-id');
            const mediaType = item.getAttribute('data-type');
            const apiKey = await getApiKey();
            if (apiKey) {
                fetchSelectedMedia(apiKey, mediaId, mediaType);
                searchSuggestions.classList.add('hidden');
            }
        });
    });
}


async function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const searchInputValue = searchInput.value.trim();
    const apiKey = await getApiKey();

    if (!searchInputValue) {
        document.getElementById('searchSuggestions').innerHTML = '';
        return;
    }

    if (!apiKey) {
        handleError('Failed to fetch API key.');
        return;
    }

    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchInputValue)}`);
        if (response.ok) {
            const data = await response.json();
            displaySearchSuggestions(data.results);
        } else {
            handleError('Failed to fetch search results.');
        }
    } catch (error) {
        handleError('An error occurred while fetching search results:', error);
    }
}


document.getElementById('searchInput').addEventListener('input', debounce(handleSearchInput, 300));

document.getElementById('randomButton').addEventListener('click', async function() {
    const apiKey = await getApiKey();

    if (!apiKey) {
        handleError('Failed to fetch API key.');
        return;
    }

    try {
        const response = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            const randomMedia = data.results[Math.floor(Math.random() * data.results.length)];
            fetchSelectedMedia(apiKey, randomMedia.id, randomMedia.media_type);
        } else {
            handleError('Failed to fetch trending media.');
        }
    } catch (error) {
        handleError('An error occurred while fetching trending media:', error);
    }
});

// Function to fetch popular movies
async function fetchPopularMovies(apiKey, page = 1) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&page=${page}`);
        if (response.ok) {
            const data = await response.json();
            displaySearchResults(data.results);
            updatePaginationControls(data.page, data.total_pages);
            fetchUpcomingMedia(apiKey);
        } else {
            handleError('Failed to fetch popular media.');
        }
    } catch (error) {
        handleError('An error occurred while fetching popular media:', error);
    }
}


function updatePaginationControls(currentPage, totalPages) {
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');

    currentPageSpan.textContent = currentPage;

    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;

    prevPageButton.onclick = () => changePage(currentPage - 1);
    nextPageButton.onclick = () => changePage(currentPage + 1);
}

// Function to change page
function changePage(page) {
    getApiKey().then(apiKey => {
        if (apiKey) {
            fetchPopularMovies(apiKey, page);
        }
    });
}


async function fetchSelectedMedia(apiKey, mediaId, mediaType) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${apiKey}`);
        if (response.ok) {
            const media = await response.json();
            displaySelectedMedia(media, mediaType);
        } else {
            handleError('Failed to fetch media details.');
        }
    } catch (error) {
        handleError('An error occurred while fetching media details:', error);
    }
}
