// Default sample decks
// Type: Array<{ id: string, name: string, createdAt: number, cards: Array<{ id: number, question: string, answer: string }> }>

const DEFAULT_DECKS = [
    {
        id: 'deck-1',
        name: 'Spanish Vocabulary',
        createdAt: 1707139200000, // 2024-02-06
        cards: [
            { id: 1, question: 'Hola', answer: 'Hello' },
            { id: 2, question: 'Adiós', answer: 'Goodbye' },
            { id: 3, question: 'Gracias', answer: 'Thank you' }
        ]
    },
    {
        id: 'deck-2',
        name: 'Biology Basics',
        createdAt: 1707139200000, // 2024-02-06
        cards: [
            { id: 1, question: 'What is photosynthesis?', answer: 'Process by which plants convert sunlight into chemical energy' },
            { id: 2, question: 'Define mitochondria', answer: 'The powerhouse of the cell, responsible for energy production' },
            { id: 3, question: 'What is ATP?', answer: 'Adenosine triphosphate, the primary energy currency in cells' }
        ]
    }
];

let decks = [];

// ===== STATE MANAGEMENT =====
let state = {
    activeDeckId: null,
    currentCardIndex: 0,
    isCardFlipped: false,
    isShuffled: false,
    originalOrder: [],
    displayedCards: [],
    searchQuery: '',
    filteredCards: [],
    searchDebounceTimer: null
};

// ===== DOM ELEMENTS =====
const deckList = document.getElementById('deckList');
const emptyDecksState = document.getElementById('emptyDecksState');
const cardContainer = document.getElementById('cardContainer');
const card = document.getElementById('card');
const emptyCardsState = document.getElementById('emptyCardsState');
const cardElement = document.getElementById('card');
const cardText = document.getElementById('cardText');
const cardCounter = document.getElementById('cardCounter');
const flipBtn = document.getElementById('flipBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const newDeckBtn = document.getElementById('newDeckBtn');
const searchInput = document.getElementById('searchInput');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderDeckList();
    setupEventListeners();
    setupKeyboardShortcuts();
});

// ===== LOCALSTORAGE HELPERS =====
/**
 * Load decks from localStorage, or use default decks if not found
 */
function loadState() {
    try {
        const savedDecks = localStorage.getItem('flashcards-decks');
        if (savedDecks) {
            decks = JSON.parse(savedDecks);
        } else {
            decks = JSON.parse(JSON.stringify(DEFAULT_DECKS));
            saveState();
        }
    } catch (error) {
        console.error('Error loading decks from localStorage:', error);
        decks = JSON.parse(JSON.stringify(DEFAULT_DECKS));
    }
}

/**
 * Save current decks to localStorage
 */
function saveState() {
    try {
        localStorage.setItem('flashcards-decks', JSON.stringify(decks));
    } catch (error) {
        console.error('Error saving decks to localStorage:', error);
    }
}

/**
 * Clear all data and reset to default decks
 */
function resetState() {
    if (confirm('Reset all decks to default? This cannot be undone.')) {
        decks = JSON.parse(JSON.stringify(DEFAULT_DECKS));
        saveState();
        state.activeDeckId = null;
        state.currentCardIndex = 0;
        state.isCardFlipped = false;
        renderDeckList();
        displayCard();
    }
}

// ===== RENDER DECK LIST =====
function renderDeckList() {
    deckList.innerHTML = '';
    
    if (decks.length === 0) {
        emptyDecksState.style.display = 'block';
        return;
    }
    
    emptyDecksState.style.display = 'none';
    
    decks.forEach(deck => {
        const li = document.createElement('li');
        li.className = 'deck-item';
        li.dataset.deckId = deck.id;
        li.innerHTML = `
            <span>${deck.name}</span>
            <small class="card-count">${deck.cards.length} cards</small>
        `;
        li.addEventListener('click', () => selectDeck(deck.id));
        deckList.appendChild(li);
    });
}

// ===== SELECT DECK AND ENTER STUDY MODE =====
function selectDeck(deckId) {
    state.activeDeckId = deckId;
    state.currentCardIndex = 0;
    state.isCardFlipped = false;
    state.isShuffled = false;
    state.searchQuery = '';
    
    // Clear search input
    searchInput.value = '';

    const deck = decks.find(d => d.id === deckId);
    state.displayedCards = [...deck.cards];
    state.filteredCards = [...deck.cards];
    state.originalOrder = [...deck.cards];

    // Update UI
    updateDeckSelection();
    displayCard();
}

// ===== UPDATE DECK SELECTION VISUAL =====
function updateDeckSelection() {
    document.querySelectorAll('.deck-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.deckId === state.activeDeckId) {
            item.classList.add('active');
        }
    });
}

// ===== DISPLAY CURRENT CARD =====
function displayCard() {
    if (!state.activeDeckId) {
        // No deck selected
        cardElement.style.display = 'none';
        emptyCardsState.style.display = 'none';
        cardText.textContent = 'Select a deck to start studying';
        cardCounter.textContent = '0/0';
        return;
    }

    if (state.displayedCards.length === 0) {
        // Deck selected but no cards (empty or no search results)
        cardElement.style.display = 'none';
        emptyCardsState.style.display = 'block';
        cardCounter.textContent = '0/0';
        return;
    }

    // Show card, hide empty state
    cardElement.style.display = 'block';
    emptyCardsState.style.display = 'none';

    const card = state.displayedCards[state.currentCardIndex];
    const content = state.isCardFlipped ? card.answer : card.question;
    const label = state.isCardFlipped ? 'Answer' : 'Question';
    const highlightedContent = highlightMatches(content, state.searchQuery);

    cardText.innerHTML = `
        <span class="card-label">${label}</span>
        <p>${highlightedContent}</p>
    `;

    cardCounter.textContent = `${state.currentCardIndex + 1}/${state.displayedCards.length}`;
    cardCounter.setAttribute('aria-label', `Card ${state.currentCardIndex + 1} of ${state.displayedCards.length}`);

    // Update flip state on card element
    if (state.isCardFlipped) {
        cardElement.classList.add('is-flipped');
    } else {
        cardElement.classList.remove('is-flipped');
    }
}

// ===== FLIP CARD =====
function flipCard() {
    state.isCardFlipped = !state.isCardFlipped;
    displayCard();
}

// ===== NAVIGATE TO NEXT CARD =====
function nextCard() {
    if (state.displayedCards.length === 0) return;
    state.currentCardIndex = (state.currentCardIndex + 1) % state.displayedCards.length;
    state.isCardFlipped = false;
    displayCard();
}

// ===== NAVIGATE TO PREVIOUS CARD =====
function previousCard() {
    if (state.displayedCards.length === 0) return;
    state.currentCardIndex = (state.currentCardIndex - 1 + state.displayedCards.length) % state.displayedCards.length;
    state.isCardFlipped = false;
    displayCard();
}

// ===== SHUFFLE DECK =====
function toggleShuffle() {
    if (!state.activeDeckId) return;

    state.isShuffled = !state.isShuffled;

    if (state.isShuffled) {
        // Fisher-Yates shuffle algorithm
        const shuffled = [...state.displayedCards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        state.displayedCards = shuffled;
        shuffleBtn.classList.add('active');
        shuffleBtn.setAttribute('aria-pressed', 'true');
    } else {
        // Restore original order
        state.displayedCards = [...state.originalOrder];
        shuffleBtn.classList.remove('active');
        shuffleBtn.setAttribute('aria-pressed', 'false');
    }

    state.currentCardIndex = 0;
    state.isCardFlipped = false;
    displayCard();
}

// ===== ESCAPE HTML TO PREVENT XSS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== SEARCH & FILTERING =====
/**
 * Debounced search function (300ms)
 * Filters cards by question or answer match
 */
function onSearchInput(event) {
    const query = event.target.value.trim().toLowerCase();
    state.searchQuery = query;

    // Clear previous timer
    if (state.searchDebounceTimer) {
        clearTimeout(state.searchDebounceTimer);
    }

    // Debounce search by 300ms
    state.searchDebounceTimer = setTimeout(() => {
        performSearch(query);
    }, 300);
}

/**
 * Perform the actual search and filter cards
 */
function performSearch(query) {
    if (!state.activeDeckId) return;

    if (query === '') {
        // No search, show all cards
        const deck = decks.find(d => d.id === state.activeDeckId);
        if (deck) {
            state.filteredCards = [...deck.cards];
            if (state.isShuffled) {
                state.displayedCards = shuffleArray([...state.filteredCards]);
            } else {
                state.displayedCards = [...state.filteredCards];
                state.originalOrder = [...state.filteredCards];
            }
        }
    } else {
        // Search and filter
        const deck = decks.find(d => d.id === state.activeDeckId);
        if (deck) {
            state.filteredCards = deck.cards.filter(card => 
                card.question.toLowerCase().includes(query) ||
                card.answer.toLowerCase().includes(query)
            );

            if (state.isShuffled) {
                state.displayedCards = shuffleArray([...state.filteredCards]);
            } else {
                state.displayedCards = [...state.filteredCards];
                state.originalOrder = [...state.filteredCards];
            }
        }
    }

    // Reset to first card and clear flip state
    state.currentCardIndex = 0;
    state.isCardFlipped = false;
    displayCard();
}

/**
 * Helper function to shuffle array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Highlight search matches in text
 */
function highlightMatches(text, query) {
    if (!query) return escapeHtml(text);
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const escaped = escapeHtml(text);
    return escaped.replace(regex, '<mark>$1</mark>');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    flipBtn.addEventListener('click', flipCard);
    prevBtn.addEventListener('click', previousCard);
    nextBtn.addEventListener('click', nextCard);
    shuffleBtn.addEventListener('click', toggleShuffle);
    cardElement.addEventListener('click', flipCard);
    newDeckBtn.addEventListener('click', createNewDeck);
    searchInput.addEventListener('input', onSearchInput);
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Space: flip card
        if (e.code === 'Space') {
            e.preventDefault();
            flipCard();
        }
        // ArrowRight: next card
        else if (e.code === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        }
        // ArrowLeft: previous card
        else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            previousCard();
        }
        // 's' or 'S': shuffle
        else if (e.key === 's' || e.key === 'S') {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                toggleShuffle();
            }
        }
    });
}

// ===== CREATE NEW DECK =====
function createNewDeck() {
    const deckName = prompt('Enter deck name:');
    if (deckName && deckName.trim()) {
        const newDeck = {
            id: `deck-${Date.now()}`,
            name: deckName.trim(),
            createdAt: Date.now(),
            cards: []
        };
        decks.push(newDeck);
        saveState();
        renderDeckList();
        selectDeck(newDeck.id);
    }
}

// ===== CARD CRUD OPERATIONS =====
/**
 * Add a new card to the active deck
 */
function addCard(question, answer) {
    if (!state.activeDeckId) return;
    const deck = decks.find(d => d.id === state.activeDeckId);
    if (!deck) return;

    const newCard = {
        id: Math.max(...(deck.cards.map(c => c.id) || [0]), 0) + 1,
        question: question.trim(),
        answer: answer.trim()
    };
    deck.cards.push(newCard);
    state.displayedCards = [...deck.cards];
    state.originalOrder = [...deck.cards];
    saveState();
    renderDeckList();
    displayCard();
}

/**
 * Edit an existing card
 */
function editCard(cardIndex, newQuestion, newAnswer) {
    if (!state.activeDeckId || cardIndex < 0 || cardIndex >= state.displayedCards.length) return;
    const deck = decks.find(d => d.id === state.activeDeckId);
    if (!deck) return;

    const cardId = state.displayedCards[cardIndex].id;
    const card = deck.cards.find(c => c.id === cardId);
    if (card) {
        card.question = newQuestion.trim();
        card.answer = newAnswer.trim();
        state.displayedCards[cardIndex] = card;
        saveState();
        displayCard();
    }
}

/**
 * Delete a card from the active deck
 */
function deleteCard(cardIndex) {
    if (!state.activeDeckId || cardIndex < 0 || cardIndex >= state.displayedCards.length) return;
    const deck = decks.find(d => d.id === state.activeDeckId);
    if (!deck) return;

    const cardId = state.displayedCards[cardIndex].id;
    deck.cards = deck.cards.filter(c => c.id !== cardId);
    state.displayedCards = state.displayedCards.filter((_, i) => i !== cardIndex);
    state.originalOrder = [...state.displayedCards];
    
    if (state.currentCardIndex >= state.displayedCards.length && state.displayedCards.length > 0) {
        state.currentCardIndex = state.displayedCards.length - 1;
    }
    state.isCardFlipped = false;
    
    saveState();
    renderDeckList();
    displayCard();
}