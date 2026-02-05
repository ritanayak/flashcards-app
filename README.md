                         Pilot Reflection
                         -----------------

1- Where AI saved time?

AI helped accelerate development by generating the initial structure for deck state management, card navigation, and search filtering with debouncing. Features like localStorage persistence, keyboard shortcuts, and shuffle logic were scaffolded quickly, allowing me to focus on refining UI behavior, accessibility, and edge cases rather than writing repetitive boilerplate logic.

2- One AI bug you identified and how you fixed it?

An AI-generated issue was duplicate DOM references (card and cardElement) and overlapping state updates, which caused confusion when updating the flip animation and display logic. I resolved this by standardizing on a single cardElement reference and ensuring the flip state was controlled exclusively through state.isCardFlipped, with the .is-flipped CSS class toggled only inside displayCard().

3- A code snippet refactored for clarity

 Before (duplicate logic in multiple places)
 
Repeat this pattern in selectDeck, performSearch, toggleShuffle, and deleteCard:

state.currentCardIndex = 0;
state.isCardFlipped = false;
displayCard();

After (refactored helper for clarity and consistency)

 Refactored that repeated logic into a single helper function:

function resetCardState() {
    state.currentCardIndex = 0;
    state.isCardFlipped = false;
}

And then reused it like this:

resetCardState();
displayCard();


4- One accessibility improvement added

Several accessibility improvements were added, including ARIA labels, keyboard navigation, and WCAG-compliant focus indicators. Users can flip cards using the spacebar, navigate with arrow keys, and shuffle using the “S” key. The card counter updates with aria-live and descriptive aria-label text so screen readers announce progress correctly.

5- Prompt changes that improved AI output

AI output improved significantly after adding explicit constraints in prompts, such as “do not duplicate state,” “preserve existing DOM structure,” and “only add logic for .is-flipped animation.” Narrowing prompts to specific goals (accessibility, animation, or performance) reduced errors and produced more targeted, usable code suggestions.
