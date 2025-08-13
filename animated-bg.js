// Animated Background Script with Interactive Elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing animated background...');

    // Create background container if it doesn't exist
    let bgContainer = document.getElementById('animated-background');
    if (!bgContainer) {
        bgContainer = document.createElement('div');
        bgContainer.id = 'animated-background';
        bgContainer.className = 'animated-background';
        document.body.insertBefore(bgContainer, document.body.firstChild);

        // Add grid
        const grid = document.createElement('div');
        grid.className = 'grid';
        bgContainer.appendChild(grid);

        // Add particles container
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        bgContainer.appendChild(particlesContainer);

        // Add particles
        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            createParticle(particlesContainer);
        }

        // Add floating elements
        const elementCount = 15;
        const elementTypes = ['book', 'atom', 'formula', 'binary', 'circuit'];
        const formulas = ['E=mc²', 'F=ma', 'a²+b²=c²', 'E=hf', 'V=IR'];
        const binaries = ['01010', '10101', '11001', '00110', '10011'];

        // Store all interactive elements
        window.interactiveElements = [];

        for (let i = 0; i < elementCount; i++) {
            const type = elementTypes[Math.floor(Math.random() * elementTypes.length)];
            createFloatingElement(bgContainer, type, formulas, binaries);
        }

        // Add glowing orbs
        const orbCount = 3;
        for (let i = 0; i < orbCount; i++) {
            createOrb(bgContainer);
        }

        // Add cursor tracking for interactive elements
        initCursorInteraction(bgContainer);
    }

    console.log('Animated background initialized');
});

// Initialize cursor interaction
function initCursorInteraction(container) {
    // Track mouse position
    let mouseX = 0;
    let mouseY = 0;

    // Update mouse position on move
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Calculate grid cell position
        const cellSize = 50; // Match the grid size in CSS
        const gridX = Math.floor(mouseX / cellSize) * cellSize;
        const gridY = Math.floor(mouseY / cellSize) * cellSize;

        // Create grid cell highlight if it doesn't exist
        highlightGridCell(container, gridX, gridY, cellSize);

        // Apply repulsion effect to all interactive elements
        applyRepulsionEffect(mouseX, mouseY);
    });

    // Add click effect
    document.addEventListener('click', function(e) {
        createRippleEffect(e.clientX, e.clientY, container);

        // Create a stronger grid highlight on click
        const clickHighlight = document.createElement('div');
        clickHighlight.className = 'grid-click-highlight';
        clickHighlight.style.left = `${e.clientX}px`;
        clickHighlight.style.top = `${e.clientY}px`;
        container.appendChild(clickHighlight);

        // Remove the click highlight after animation
        setTimeout(() => {
            clickHighlight.remove();
        }, 1000);
    });

    // Start animation loop for smooth interactions
    requestAnimationFrame(updateElements);
}

// Track the current highlighted cell and its position
let currentHighlightedCell = null;
let currentCellX = -1;
let currentCellY = -1;
let fadeTimeouts = []; // Track all fade timeouts

// Simple function to highlight the grid cell under the cursor
function highlightGridCell(container, gridX, gridY, cellSize) {
    // If the cursor moved to a different cell
    if (gridX !== currentCellX || gridY !== currentCellY) {
        // Remove any existing highlight with a smooth fade
        if (currentHighlightedCell) {
            const oldCell = currentHighlightedCell;
            oldCell.classList.add('fading');

            // Clear any existing timeouts to prevent memory leaks
            fadeTimeouts.forEach(timeout => clearTimeout(timeout));
            fadeTimeouts = [];

            // Remove the element after the transition completes
            const timeout = setTimeout(() => {
                if (oldCell.parentNode) {
                    oldCell.remove();
                }
            }, 500); // Match this with the CSS transition time (0.5s)

            fadeTimeouts.push(timeout);
        }

        // Create a new highlight for the current cell
        const cellHighlight = document.createElement('div');
        cellHighlight.className = 'grid-cell-highlight';
        cellHighlight.style.left = `${gridX}px`;
        cellHighlight.style.top = `${gridY}px`;
        cellHighlight.style.width = `${cellSize}px`;
        cellHighlight.style.height = `${cellSize}px`;

        // Apply theme-specific colors
        if (document.body.classList.contains('dark-theme')) {
            cellHighlight.classList.add('dark-theme');
        }

        // Add to the container
        container.appendChild(cellHighlight);

        // Update tracking variables
        currentHighlightedCell = cellHighlight;
        currentCellX = gridX;
        currentCellY = gridY;
    }
}

// Apply repulsion effect to elements
function applyRepulsionEffect(mouseX, mouseY) {
    if (!window.interactiveElements) return;

    window.interactiveElements.forEach(element => {
        // Get element position and size
        const rect = element.getBoundingClientRect();
        const elementX = rect.left + rect.width / 2;
        const elementY = rect.top + rect.height / 2;

        // Calculate distance between mouse and element
        const dx = mouseX - elementX;
        const dy = mouseY - elementY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply repulsion if mouse is close enough
        const repulsionRadius = 150; // pixels
        if (distance < repulsionRadius) {
            // Calculate repulsion force (stronger when closer)
            const force = (1 - distance / repulsionRadius) * 30;

            // Calculate repulsion direction (away from mouse)
            const angle = Math.atan2(dy, dx);
            const repulsionX = -Math.cos(angle) * force;
            const repulsionY = -Math.sin(angle) * force;

            // Apply repulsion to element's position
            element.style.transform = `translate(${repulsionX}px, ${repulsionY}px) scale(${1 + force/100})`;

            // Add glow effect
            element.style.filter = `brightness(${1 + force/30}) drop-shadow(0 0 ${force/3}px rgba(255, 255, 255, 0.8))`;
            element.style.zIndex = '10';
        } else {
            // Reset element position and appearance when mouse is far away
            element.style.transform = '';
            element.style.filter = '';
            element.style.zIndex = '';
        }
    });
}

// Create ripple effect on click
function createRippleEffect(x, y, container) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    container.appendChild(ripple);

    // Remove ripple after animation completes
    setTimeout(() => {
        ripple.remove();
    }, 1000);

    // Create energy burst effect
    for (let i = 0; i < 8; i++) {
        createEnergyParticle(x, y, container);
    }
}

// Create energy particle for burst effect
function createEnergyParticle(x, y, container) {
    const particle = document.createElement('div');
    particle.className = 'energy-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    // Random angle and speed
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const distance = 50 + Math.random() * 100;

    // Calculate x and y offsets using the angle
    const xOffset = Math.cos(angle) * distance;
    const yOffset = Math.sin(angle) * distance;

    // Set particle properties
    particle.style.setProperty('--x', xOffset + 'px');
    particle.style.setProperty('--y', yOffset + 'px');

    // Random color variations
    const hue = Math.random() * 60 - 30; // -30 to +30 degrees from base color
    particle.style.filter = `hue-rotate(${hue}deg)`;

    container.appendChild(particle);

    // Remove particle after animation completes
    setTimeout(() => {
        particle.remove();
    }, 1000);
}

// Update elements animation loop
function updateElements() {
    // Continue animation loop
    requestAnimationFrame(updateElements);
}

// Create a particle
function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random size between 2 and 6 pixels
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random position
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;

    // Random opacity
    particle.style.opacity = Math.random() * 0.5 + 0.3;

    // Random animation delay
    const delay = Math.random() * 5;
    particle.style.animationDelay = `${delay}s`;

    container.appendChild(particle);
}

// Create a floating element
function createFloatingElement(container, type, formulas, binaries) {
    const element = document.createElement('div');
    element.className = `floating-element ${type}`;

    // Random position
    const posX = Math.random() * 90 + 5;
    const posY = Math.random() * 90 + 5;
    element.style.left = `${posX}%`;
    element.style.top = `${posY}%`;

    // Random animation delay
    const delay = Math.random() * 5;
    element.style.animationDelay = `${delay}s`;

    // Set content for text elements
    if (type === 'formula') {
        element.textContent = formulas[Math.floor(Math.random() * formulas.length)];
    } else if (type === 'binary') {
        element.textContent = binaries[Math.floor(Math.random() * binaries.length)];
    }

    // Add to container and store reference for interaction
    container.appendChild(element);

    // Add to interactive elements array
    if (window.interactiveElements) {
        window.interactiveElements.push(element);
    }

    // Add hover effect
    element.addEventListener('mouseenter', function() {
        element.classList.add('hover');
    });

    element.addEventListener('mouseleave', function() {
        element.classList.remove('hover');
    });
}

// Create a glowing orb
function createOrb(container) {
    const orb = document.createElement('div');
    orb.className = 'orb';

    // Random position
    const posX = Math.random() * 80 + 10;
    const posY = Math.random() * 80 + 10;
    orb.style.left = `${posX}%`;
    orb.style.top = `${posY}%`;

    // Random animation delay
    const delay = Math.random() * 4;
    orb.style.animationDelay = `${delay}s`;

    container.appendChild(orb);

    // Add to interactive elements array
    if (window.interactiveElements) {
        window.interactiveElements.push(orb);
    }
}
