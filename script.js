// Enhanced dataset with images and more details
const cars = [
  { 
    name: "Tesla Model S", 
    type: "Sedan", 
    fuel: "Electric", 
    brand: "Tesla",
    image: "https://images.pexels.com/photos/11947405/pexels-photo-11947405.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Premium EV"
  },
  { 
    name: "Tesla Model X", 
    type: "SUV", 
    fuel: "Electric", 
    brand: "Tesla",
    image: "https://images.pexels.com/photos/11947407/pexels-photo-11947407.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Luxury SUV"
  },
  { 
    name: "Toyota Corolla", 
    type: "Sedan", 
    fuel: "Petrol", 
    brand: "Toyota",
    image: "https://images.pexels.com/photos/2127733/pexels-photo-2127733.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Reliable"
  },
  { 
    name: "Toyota Prius", 
    type: "Hatchback", 
    fuel: "Hybrid", 
    brand: "Toyota",
    image: "https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Eco-Friendly"
  },
  { 
    name: "Ford F-150", 
    type: "SUV", 
    fuel: "Diesel", 
    brand: "Ford",
    image: "https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Heavy Duty"
  },
  { 
    name: "BMW i3", 
    type: "Hatchback", 
    fuel: "Electric", 
    brand: "BMW",
    image: "https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Innovative"
  },
  { 
    name: "BMW 3 Series", 
    type: "Sedan", 
    fuel: "Petrol", 
    brand: "BMW",
    image: "https://images.pexels.com/photos/2365572/pexels-photo-2365572.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Sport Luxury"
  }
];

// Enhanced search suggestions
const carTypes = ["SUV", "Sedan", "Hatchback", "Coupe", "Electric", "Hybrid", "Luxury", "Sport", "Compact"];

// DOM elements
const searchInput = document.getElementById("searchInput");
const searchContainer = document.getElementById("searchContainer");
const suggestions = document.getElementById("suggestions");
const chipList = document.getElementById("chipList");
const clearAllBtn = document.getElementById("clearAll");
const results = document.getElementById("results");
const resultsCount = document.getElementById("resultsCount");
const themeToggle = document.getElementById("themeToggle");
const viewButtons = document.querySelectorAll(".view-btn");

// State
let currentIndex = -1;
let activeFilters = [];
let currentView = "grid";

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

// Search functionality (Interaction A)
function handleSearchInput() {
  const query = searchInput.value.toLowerCase().trim();
  suggestions.innerHTML = "";
  currentIndex = -1;

  if (query) {
    const filtered = carTypes.filter(type => 
      type.toLowerCase().includes(query)
    );
    
    if (filtered.length > 0) {
      filtered.slice(0, 6).forEach((type, index) => {
        const li = document.createElement("li");
        li.textContent = type;
        li.setAttribute("role", "option");
        li.setAttribute("tabindex", "-1");
        li.addEventListener("click", () => selectSuggestion(type));
        suggestions.appendChild(li);
      });
      showSuggestions();
    } else {
      hideSuggestions();
    }
  } else {
    hideSuggestions();
  }

  renderCars();
}

function showSuggestions() {
  suggestions.classList.add("visible");
  suggestions.style.display = "block";
}

function hideSuggestions() {
  suggestions.classList.remove("visible");
  setTimeout(() => {
    suggestions.style.display = "none";
  }, 300);
}

function selectSuggestion(type) {
  searchInput.value = type;
  hideSuggestions();
  renderCars();
  searchInput.focus();
}

function handleSearchKeydown(e) {
  const items = suggestions.querySelectorAll("li");
  if (!items.length) return;

  switch(e.key) {
    case "ArrowDown":
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, items.length - 1);
      updateActiveItem(items);
      break;
    case "ArrowUp":
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, -1);
      updateActiveItem(items);
      break;
    case "Enter":
      e.preventDefault();
      if (currentIndex >= 0 && items[currentIndex]) {
        selectSuggestion(items[currentIndex].textContent);
      }
      break;
    case "Escape":
      hideSuggestions();
      searchInput.blur();
      break;
  }
}

function updateActiveItem(items) {
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentIndex);
  });
}

// Expandable search container
searchInput.addEventListener("focus", () => {
  searchContainer.classList.add("expanded");
});

searchInput.addEventListener("blur", (e) => {
  // Delay to allow suggestion clicks
  setTimeout(() => {
    if (!searchInput.matches(':focus')) {
      searchContainer.classList.remove("expanded");
      hideSuggestions();
    }
  }, 200);
});

// Filter and Chips functionality (Interaction B)
function addFilter(value, category) {
  if (activeFilters.find(filter => filter.value === value)) return;

  const filter = { value, category };
  activeFilters.push(filter);

  const chip = createChip(filter);
  chipList.appendChild(chip);
  
  updateChipListVisibility();
  renderCars();
  
  // Announce to screen readers
  announceFilter(`${value} filter added`, "added");
}

function createChip(filter) {
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.dataset.value = filter.value;
  chip.innerHTML = `
    ${filter.value}
    <button aria-label="Remove ${filter.value} filter">&times;</button>
  `;

  const removeBtn = chip.querySelector("button");
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFilter(filter.value);
  });

  return chip;
}

function removeFilter(value) {
  const chip = chipList.querySelector(`[data-value="${value}"]`);
  if (!chip) return;

  chip.classList.add("removing");
  
  chip.addEventListener("animationend", () => {
    chip.remove();
    activeFilters = activeFilters.filter(filter => filter.value !== value);
    updateChipListVisibility();
    renderCars();
  });

  // Announce to screen readers
  announceFilter(`${value} filter removed`, "removed");
}

function clearAllFilters() {
  const chips = chipList.querySelectorAll(".chip");
  let removedCount = 0;

  chips.forEach((chip, index) => {
    setTimeout(() => {
      chip.classList.add("removing");
      chip.addEventListener("animationend", () => {
        chip.remove();
        removedCount++;
        if (removedCount === chips.length) {
          activeFilters = [];
          updateChipListVisibility();
          renderCars();
        }
      });
    }, index * 50); // Stagger animations
  });

  if (chips.length > 0) {
    announceFilter("All filters cleared", "cleared");
  }
}

function updateChipListVisibility() {
  clearAllBtn.style.display = activeFilters.length > 0 ? "flex" : "none";
}

function announceFilter(message, action) {
  // Create temporary element for screen reader announcement
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.style.position = "absolute";
  announcement.style.width = "1px";
  announcement.style.height = "1px";
  announcement.style.overflow = "hidden";
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

// Car rendering
function renderCars() {
  const query = searchInput.value.toLowerCase().trim();
  results.innerHTML = "";

  let filtered = cars.filter(car => {
    const matchesSearch = !query || 
      car.name.toLowerCase().includes(query) ||
      car.type.toLowerCase().includes(query) ||
      car.fuel.toLowerCase().includes(query) ||
      car.brand.toLowerCase().includes(query) ||
      car.badge.toLowerCase().includes(query);

    const matchesFilters = activeFilters.length === 0 || 
      activeFilters.some(filter => 
        car.fuel === filter.value || car.brand === filter.value
      );

    return matchesSearch && matchesFilters;
  });

  updateResultsCount(filtered.length);

  if (filtered.length === 0) {
    renderEmptyState();
    return;
  }

  filtered.forEach((car, index) => {
    const card = createCarCard(car);
    card.style.animationDelay = `${index * 0.1}s`;
    results.appendChild(card);
  });
}

function createCarCard(car) {
  const card = document.createElement("div");
  card.className = "car-card";
  
  const fuelIcon = getFuelIcon(car.fuel);
  const typeIcon = getTypeIcon(car.type);
  
  card.innerHTML = `
    <img src="${car.image}" alt="${car.name}" class="car-image" loading="lazy">
    <div class="car-info">
      <h3 class="car-name">${car.name}</h3>
      <div class="car-specs">
        <div class="car-spec">
          <svg class="car-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${typeIcon}
          </svg>
          ${car.type}
        </div>
        <div class="car-spec">
          <svg class="car-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${fuelIcon}
          </svg>
          ${car.fuel}
        </div>
        <div class="car-spec">
          <svg class="car-spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
          </svg>
          ${car.brand}
        </div>
      </div>
      <div class="car-badge">${car.badge}</div>
    </div>
  `;

  return card;
}

function getFuelIcon(fuel) {
  const icons = {
    Electric: '<circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4M12 8v8"/>',
    Hybrid: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    Petrol: '<path d="M3 12h18M12 3v18"/>',
    Diesel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/>'
  };
  return icons[fuel] || icons.Petrol;
}

function getTypeIcon(type) {
  const icons = {
    SUV: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10h-1.3l-1.2-6H8.5l-1.2 6H6l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    Sedan: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10h-1.3l-1.2-6H8.5l-1.2 6H6l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    Hatchback: '<path d="M7 17h10l4-10H3l4 10Z"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>'
  };
  return icons[type] || icons.Sedan;
}

function renderEmptyState() {
  results.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <h3>No cars found</h3>
      <p>Try adjusting your search terms or filters</p>
    </div>
  `;
}

function updateResultsCount(count) {
  resultsCount.textContent = `${count} car${count !== 1 ? 's' : ''} found`;
}

// View toggle
function setView(view) {
  currentView = view;
  results.className = `results ${view === "list" ? "list-view" : ""}`;
  
  viewButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

// Event listeners
searchInput.addEventListener("input", handleSearchInput);
searchInput.addEventListener("keydown", handleSearchKeydown);

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.value;
    const category = btn.dataset.category;
    addFilter(value, category);
  });
});

clearAllBtn.addEventListener("click", clearAllFilters);
themeToggle.addEventListener("click", toggleTheme);

viewButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    setView(btn.dataset.view);
  });
});

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!searchContainer.contains(e.target)) {
    hideSuggestions();
  }
});

// Initialize
initTheme();
renderCars();

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Alt + T for theme toggle
  if (e.altKey && e.key === "t") {
    e.preventDefault();
    toggleTheme();
  }
  
  // Alt + F to focus search
  if (e.altKey && e.key === "f") {
    e.preventDefault();
    searchInput.focus();
  }
  
  // Escape to clear search
  if (e.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    handleSearchInput();
    searchInput.blur();
  }
});
