/* Dataset: Cars */
const cars = [
  { name: "Tesla Model S", type: "Sedan", fuel: "Electric", brand: "Tesla" },
  { name: "Tesla Model X", type: "SUV", fuel: "Electric", brand: "Tesla" },
  { name: "Toyota Corolla", type: "Sedan", fuel: "Petrol", brand: "Toyota" },
  { name: "Toyota Prius", type: "Hatchback", fuel: "Hybrid", brand: "Toyota" },
  { name: "Ford F-150", type: "SUV", fuel: "Diesel", brand: "Ford" },
  { name: "BMW i3", type: "Hatchback", fuel: "Electric", brand: "BMW" },
  { name: "BMW 3 Series", type: "Sedan", fuel: "Petrol", brand: "BMW" }
];

const searchInput = document.getElementById("searchInput");
const suggestions = document.getElementById("suggestions");
const chipList = document.getElementById("chipList");
const results = document.getElementById("results");

const carTypes = ["SUV", "Sedan", "Hatchback", "Coupe", "Electric", "Hybrid"];

let currentIndex = -1;
let activeFilters = [];

/* Render cars */
function renderCars() {
  const query = searchInput.value.toLowerCase();
  results.innerHTML = "";

  let filtered = cars.filter(car =>
    car.name.toLowerCase().includes(query) ||
    car.type.toLowerCase().includes(query)
  );

  if (activeFilters.length > 0) {
    filtered = filtered.filter(car =>
      activeFilters.some(f =>
        car.fuel === f || car.brand === f
      )
    );
  }

  if (filtered.length === 0) {
    results.innerHTML = "<p>No cars found.</p>";
    return;
  }

  filtered.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
      <h3>${car.name}</h3>
      <p>Type: ${car.type}</p>
      <p>Fuel: ${car.fuel}</p>
      <p>Brand: ${car.brand}</p>
    `;
    results.appendChild(card);
  });
}

/* Search Suggestions */
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  suggestions.innerHTML = "";
  currentIndex = -1;

  if (query) {
    const filtered = carTypes.filter(type => type.toLowerCase().includes(query));
    if (filtered.length > 0) {
      filtered.forEach(type => {
        const li = document.createElement("li");
        li.textContent = type;
        li.setAttribute("role", "option");
        li.addEventListener("click", () => {
          searchInput.value = type;
          suggestions.style.display = "none";
          renderCars();
        });
        suggestions.appendChild(li);
      });
      suggestions.style.display = "block";
    } else {
      suggestions.style.display = "none";
    }
  } else {
    suggestions.style.display = "none";
  }

  renderCars();
});

searchInput.addEventListener("keydown", (e) => {
  const items = suggestions.querySelectorAll("li");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % items.length;
    updateActive(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateActive(items);
  } else if (e.key === "Enter" && currentIndex >= 0) {
    e.preventDefault();
    items[currentIndex].click();
  }
});

function updateActive(items) {
  items.forEach(item => item.classList.remove("active"));
  if (items[currentIndex]) items[currentIndex].classList.add("active");
}

/* Chips */
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.value;
    if (!chipList.querySelector(`[data-value="${value}"]`)) {
      activeFilters.push(value);

      const chip = document.createElement("div");
      chip.className = "chip";
      chip.dataset.value = value;
      chip.innerHTML = `${value} <button aria-label="Remove ${value}">&times;</button>`;

      chip.querySelector("button").addEventListener("click", () => {
        chip.style.animation = "popOut 0.3s forwards";
        chip.addEventListener("animationend", () => {
          chip.remove();
          activeFilters = activeFilters.filter(f => f !== value);
          renderCars();
        });
      });

      chipList.appendChild(chip);
      renderCars();
    }
  });
});

/* Initial render */
renderCars();
