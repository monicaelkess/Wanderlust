const dropdown = document.getElementById("dropdown");
const selected = document.getElementById("selected");
const list = document.getElementById("country-list");
const searchInput = document.getElementById("search-input");
const citySelect = document.getElementById("global-city");

let countries = [];

selected.onclick = function () {
    dropdown.classList.toggle("active");
};


/*********************************
 * dashboard - country selector
 *********************************/
fetch("https://date.nager.at/api/v3/AvailableCountries")
    .then(function (res) { return res.json(); })
    .then(function (data) {
        countries = data;
        renderCountries(countries);
    });

const yearSelect = document.getElementById("global-year");
let selectedYear = yearSelect.value; 

yearSelect.addEventListener("change", function () {
  selectedYear = this.value;
  const img = selected.querySelector(".country-left img");
  const span = selected.querySelector(".country-left span");
  if (!img || !span) return;

  const countryCode = img.src.split("/").pop().split(".")[0].toUpperCase();
  const countryName = span.textContent.split(" (")[0];
  holidayInfo(countryName, countryCode, selectedYear);
  loadLongWeekends(countryName, countryCode, selectedYear);
  if (citySelect.value) {
    loadEvents(countryName, countryCode, citySelect.value);
    loadWeather(countryName, countryCode, citySelect.value);
    loadSunTimes(countryCode, countryName, citySelect.value);
  }
});



function renderCountries(data) {
    list.innerHTML = ``;
    for (let i = 0; i < data.length; i++) {
        const country = data[i];
        const li = document.createElement("li");
        li.innerHTML = `
      <div class="country-left">
        <img src="https://flagcdn.com/w40/${country.countryCode.toLowerCase()}.png">
        <span>${country.name}</span>
      </div>
      <span class="country-code">${country.countryCode}</span>
    `;
        li.onclick = function () {
            setSelected(country);
            dropdown.classList.remove("active");
            loadCitiesByCountry(country.countryCode);

            selectedDestination(country);
            holidayInfo(country.name, country.countryCode, selectedYear);
            loadLongWeekends(country.name, country.countryCode, selectedYear);

        };
        list.appendChild(li);
    }
}

function setSelected(country) {
    selected.innerHTML = `
    <div class="country-left">
      <img src="https://flagcdn.com/w40/${country.countryCode.toLowerCase()}.png">
      <span>${country.name} (${country.countryCode})</span>
    </div>
    <i class="fa-solid fa-chevron-down arrow"></i>
  `;
}

searchInput.oninput = function () {
    const value = searchInput.value.toLowerCase();
    const filtered = [];
    for (let i = 0; i < countries.length; i++) {
        if (countries[i].name.toLowerCase().indexOf(value) !== -1) {
            filtered.push(countries[i]);
        }
    }
    renderCountries(filtered);
};

document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
    }
});

function loadCitiesByCountry(countryCode) {
    // citySelect.innerHTML = `<option value="">Loading...</option>`;
    fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`)
        .then(function (res) { return res.json(); })
        .then(function (data) {
            citySelect.innerHTML = `<option value=""> Select City</option>`;
            if (!data || data.length === 0) { return; }
            const country = data[0];
            if (!country.capital || country.capital.length === 0) {
                citySelect.innerHTML = `<option value="">No capital available</option>`;
                return;
            }
            for (let i = 0; i < country.capital.length; i++) {
                const option = document.createElement("option");
                option.value = country.capital[i];
                option.textContent = country.capital[i];

                citySelect.appendChild(option);
            }
        })
        .catch(function () {
            citySelect.innerHTML = `<option value="">Error loading cities</option>`;
        });
}

function selectedDestination(country) {
    const destinationDiv = document.querySelector('.selected-destination');
    destinationDiv.style.display = 'flex';

    const cityName = citySelect.value ? `• ${citySelect.value}` : "";

    destinationDiv.innerHTML = `
    <div class="selected-flag">
      <img id="selected-country-flag" src="https://flagcdn.com/w80/${country.countryCode.toLowerCase()}.png" alt="${country.name}">
    </div>
    <div class="selected-info">
      <span class="selected-country-name" id="selected-country-name">${country.name}</span>
      <span class="selected-city-name" id="selected-city-name">${cityName}</span>
    </div>
    <button class="clear-selection-btn" id="clear-selection-btn">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

    const clearBtn = document.getElementById('clear-selection-btn');
    clearBtn.onclick = function () {
        destinationDiv.style.display = 'none';
        citySelect.value = "";
        selected.innerHTML = `
      <div class="country-left">
        Select Country
      </div>
      <i class="fa-solid fa-chevron-down arrow"></i>
    `;

        showToast("Selection cleared.");
    };
}


citySelect.onchange = function () {
    const countryNameEl = selected.querySelector('.country-left span');
    if (!countryNameEl) return;

    const countryCode = selected.querySelector('.country-left img')
        .src.split('/').pop().split('.')[0].toUpperCase();

    const country = {
        name: countryNameEl.textContent.split(' (')[0],
        countryCode: countryCode
    };

   
    selectedDestination({ ...country, city: citySelect.value });

   
    if (citySelect.value) {
        loadEvents(country.name, country.countryCode, citySelect.value);
        loadWeather(country.name, country.countryCode, citySelect.value);
        loadSunTimes(country.countryCode, country.name, citySelect.value);
    }
};

function showToast(message, duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

const searchbtn = document.getElementById("global-search-btn");
searchbtn.addEventListener("click", function () {
    const selectedCountry = document.querySelector('.selected-country-name');
    if (selectedCountry) {
        const countryCode = selected.querySelector('.country-left img').src.split('/').pop().split('.')[0].toUpperCase();
        countryInformation(countryCode);
        showToast(`Exploring information for ${selectedCountry.textContent}...`);
    }
});

function countryInformation(countryCode) {
    const dashboard = document.getElementById("dashboard-country-info");

    fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`)
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data || data.length === 0) return;

            const country = data[0];

          
            const flag = country.flags?.png || "";
            const name = country.name.common || "";
            const officialName = country.name.official || "";
            const region = country.region || "";
            const subregion = country.subregion || "";
            const capital = country.capital ? country.capital[0] : "N/A";
            const population = country.population?.toLocaleString() || "N/A";
            const area = country.area ? `${country.area.toLocaleString()} km²` : "N/A";
            const continent = country.continents ? country.continents[0] : "N/A";
            const callingCode = country.idd?.root && country.idd?.suffixes ? `${country.idd.root}${country.idd.suffixes[0]}` : "N/A";
            const drivingSide = country.car?.side || "N/A";
            const weekStart = country.startOfWeek || "N/A";

            // Currencies
            let currencies = "N/A";
            if (country.currencies) {
                const cur = Object.values(country.currencies)[0];
                currencies = `${cur.name} (${cur.symbol ? cur.symbol : ""})`;
            }

            // Languages
            let languages = "N/A";
            if (country.languages) {
                languages = Object.values(country.languages).join(", ");
            }

            // Borders
            var borders = [];
            if (country.borders && country.borders.length > 0) {
                borders = country.borders.map(function (code) {
                    return '<span class="neighbor-button extra-tag border-tag" data-code="' + code + '">' + code + '</span>';
                }).join(" ");
            } else {
                borders = "None";
            }

            // Google Maps link
            const mapsLink = country.maps?.googleMaps || `https://www.google.com/maps/place/${name}`;
            const timezone = country.timezones ? country.timezones[0] : "UTC";


         
            dashboard.innerHTML = `
        <div class="dashboard-country-header">
          <img src="${flag}" alt="${name}" class="dashboard-country-flag">
          <div class="dashboard-country-title">
            <h3>${name}</h3>
            <p class="official-name">${officialName}</p>
            <span class="region"><i class="fa-solid fa-location-dot"></i> ${region} • ${subregion}</span>
          </div>
        </div>

        <div class="dashboard-local-time">
          <div class="local-time-display">
            <i class="fa-solid fa-clock"></i>
            <span class="local-time-value" id="country-local-time"></span>
            <span class="local-time-zone">UTC${timezone}</span>
          </div>
        </div>

        <div class="dashboard-country-grid">
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-building-columns"></i>
            <span class="label">Capital</span>
            <span class="value">${capital}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-users"></i>
            <span class="label">Population</span>
            <span class="value">${population}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-ruler-combined"></i>
            <span class="label">Area</span>
            <span class="value">${area}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-globe"></i>
            <span class="label">Continent</span>
            <span class="value">${continent}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-phone"></i>
            <span class="label">Calling Code</span>
            <span class="value">${callingCode}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-car"></i>
            <span class="label">Driving Side</span>
            <span class="value">${drivingSide}</span>
          </div>
          <div class="dashboard-country-detail">
            <i class="fa-solid fa-calendar-week"></i>
            <span class="label">Week Starts</span>
            <span class="value">${weekStart}</span>
          </div>
        </div>

        <div class="dashboard-country-extras">
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-coins"></i> Currency</h4>
            <div class="extra-tags">
              <span class="extra-tag">${currencies}</span>
            </div>
          </div>
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-language"></i> Languages</h4>
            <div class="extra-tags">
              <span class="extra-tag">${languages}</span>
            </div>
          </div>
          <div class="dashboard-country-extra">
            <h4><i class="fa-solid fa-map-location-dot"></i> Neighbors</h4>
            <div class="extra-tags">
              ${borders}
            </div>
          </div>
        </div>

        <div class="dashboard-country-actions">
          <a href="${mapsLink}" target="_blank" class="btn-map-link">
            <i class="fa-solid fa-map"></i> View on Google Maps
          </a>
        </div>
      `;
            startCountryClock(timezone);

            var neighborButtons = document.querySelectorAll(".neighbor-button");
            neighborButtons.forEach(function (btn) {
                btn.onclick = function () {
                    var code = btn.getAttribute("data-code");
                    countryInformation(code);

                };
            });
        })
        .catch(function () {
            dashboard.innerHTML = `<p>Error loading country data.</p>`;
        });
}

function startCountryClock(timezone) {
    const timeEl = document.getElementById("country-local-time");
    const zoneEl = document.querySelector(".local-time-zone");

    if (!timeEl || !timezone) return;

    function updateTime() {

        let offset = 0;
        const match = timezone.match(/UTC([+-]\d{1,2}):?(\d{2})?/);
        if (match) {
            offset = parseInt(match[1]) * 60;
            if (match[2]) offset += parseInt(match[2]);
        }

        const now = new Date();
        const utcMinutes = now.getUTCMinutes() + now.getUTCHours() * 60;
        const totalMinutes = utcMinutes + offset;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        const seconds = now.getUTCSeconds();


        const ampm = hours >= 12 ? "PM" : "AM";
        const h12 = hours % 12 || 12;

        timeEl.textContent =
            `${h12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${ampm}`;


        if (zoneEl) zoneEl.textContent = timezone;

    }

    updateTime();
    clearInterval(window.countryClockInterval);
    window.countryClockInterval = setInterval(updateTime, 1000);
}


const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
/*********************************
 * Events
 *********************************/
function holidayInfo(countryName, countryCode, year) {
    const holidayDiv = document.getElementById("holidays-view");


    holidayDiv.innerHTML = `
    <div class="view-header-card gradient-green">
      <div class="view-header-icon">
        <i class="fa-solid fa-calendar-days"></i>
      </div>
      <div class="view-header-content">
        <h2>Public Holidays Explorer</h2>
        <p>Browse public holidays for ${countryName} and plan your trips around them</p>
      </div>
      <div class="view-header-selection">
        <div class="current-selection-badge">
          <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png">
          <span>${countryName}</span>
          <span class="selection-year">${year}</span>
        </div>
      </div>
    </div>

    <div id="holidays-content" class="holidays-content"></div>
  `;

    const holidaysContent = document.getElementById("holidays-content");

    fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            if (!data || data.length === 0) {
                holidaysContent.innerHTML = "<p>No holidays found.</p>";
                return;
            }

            for (let i = 0; i < data.length; i++) {
                const holiday = data[i];
                const date = new Date(holiday.date);

                const day = date.getDate();
                const month = date.toLocaleString("en-US", { month: "short" });
                const weekday = date.toLocaleString("en-US", { weekday: "long" });

                holidaysContent.innerHTML += `
          <div class="holiday-card">
            <div class="holiday-card-header">
              <div class="holiday-date-box">
                <span class="day">${day}</span>
                <span class="month">${month}</span>
              </div>
              <button class="holiday-action-btn"
  data-type="holiday"
  data-title="${holiday.localName.replaceAll('"', '&quot;')}"
  data-subtitle="${holiday.name.replaceAll('"', '&quot;')}"
  data-date="${holiday.date}"
  data-country="${countryName.replaceAll('"', '&quot;')}"
  data-city="">

                <i class="fa-regular fa-heart"></i>
              </button>
            </div>

            <h3>${holiday.localName}</h3>
            <p class="holiday-name">${holiday.name}</p>

            <div class="holiday-card-footer">
              <span class="holiday-day-badge">
                <i class="fa-regular fa-calendar"></i> ${weekday}
              </span>
              <span class="holiday-type-badge">Public</span>
            </div>
          </div>
        `;
            }
        })
        .catch(function () {
            holidaysContent.innerHTML = "<p>Error loading holiday data.</p>";
        });


}


var pageInfo = {
    "dashboard-view": {
        title: "Dashboard",
        subtitle: "Welcome back! Ready to plan your next adventure?"
    },
    "holidays-view": {
        title: "Holidays",
        subtitle: "Explore public holidays around the world"
    },
    "events-view": {
        title: "Events",
        subtitle: "Find concerts, sports, and entertainment"
    },
    "weather-view": {
        title: "Weather",
        subtitle: "Check forecasts for any destination"
    },
    "long-weekends-view": {
        title: "Long Weekends",
        subtitle: "Find the perfect mini-trip opportunities"
    },
    "currency-view": {
        title: "Currency",
        subtitle: "Convert currencies with live exchange rates"
    },
    "sun-times-view": {
        title: "Sun Times",
        subtitle: "Check sunrise and sunset times worldwide"
    },
    "my-plans-view": {
        title: "My Plans",
        subtitle: "Your saved holidays and events"
    }
};

// ================= UPDATE HEADER =================
function updatePageHeader(pageId) {
    var titleEl = document.getElementById("page-title");
    var subtitleEl = document.getElementById("page-subtitle");
    var timeEl = document.getElementById("current-datetime");

    // Update time
    if (timeEl) {
        timeEl.textContent = getFormattedTimeNow();
    }


    if (pageInfo[pageId] && titleEl && subtitleEl) {
        titleEl.textContent = pageInfo[pageId].title;
        subtitleEl.textContent = pageInfo[pageId].subtitle;
    }
}

function getFormattedTimeNow() {
    const now = new Date();

    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true        // AM/PM
    };
    return new Intl.DateTimeFormat('en-US', options).format(now);
}

// ================= PAGE NAVIGATION =================
window.navigateTo = function (pageId) {
    goToPage(pageId);
};





const routeMap = {
  "/": "dashboard-view",
  "/dashboard": "dashboard-view",
  "/holidays": "holidays-view",
  "/events": "events-view",
  "/weather": "weather-view",
  "/long-weekends": "long-weekends-view",
  "/currency": "currency-view",
  "/sun-times": "sun-times-view",
  "/plans": "my-plans-view",
};

function getPathForView(viewId) {
  for (const path in routeMap) {
    if (routeMap[path] === viewId) return path;
  }
  return "/dashboard";
}
function goToPage(pageId, options = { push: true }) {
  // 1) Switch views
  var views = document.querySelectorAll(".view");
  for (var i = 0; i < views.length; i++) {
    views[i].classList.remove("active");
    if (views[i].id === pageId) views[i].classList.add("active");
  }

  // 2) Update nav active state
  var navItems = document.querySelectorAll(".nav-item");
  for (var j = 0; j < navItems.length; j++) {
    navItems[j].classList.remove("active");
    if (navItems[j].getAttribute("data-view") === pageId) {
      navItems[j].classList.add("active");
    }
  }

  // 3) Update header
  updatePageHeader(pageId);

  // 4) Push URL
  if (options.push) {
    const path = getPathForView(pageId);
    history.pushState({ pageId }, "", path);
  }
}

window.addEventListener("popstate", function (e) {
  const path = location.pathname;
  const pageId = routeMap[path] || "dashboard-view";
  goToPage(pageId, { push: false });
});

var pageButtons = document.querySelectorAll("[data-page]");
for (var i = 0; i < pageButtons.length; i++) {
    pageButtons[i].addEventListener("click", function () {
        var targetPage = this.getAttribute("data-page");
        goToPage(targetPage);
    });
}
(function initRouter() {
  const path = location.pathname;
  const pageId = routeMap[path] || "dashboard-view";
  goToPage(pageId, { push: false });
})();
for (let i = 0; i < navItems.length; i++) {
  navItems[i].addEventListener("click", function (e) {
    e.preventDefault(); 
    const targetView = this.getAttribute("data-view");
    goToPage(targetView); 
  });
}
/*********************************
 * Events
 *********************************/
var TICKETMASTER_API_KEY = "TsjBS5D9Ok9hgmNKrYfQswUeoUtAd4P5";
function loadEvents(countryName, countryCode, cityName) {

    var eventsDiv = document.getElementById("events-view");
    eventsDiv.innerHTML =
        '<div class="view-header-card gradient-purple">' +
        '<div class="view-header-icon"><i class="fa-solid fa-ticket"></i></div>' +
        '<div class="view-header-content">' +
        '<h2>Events Explorer</h2>' +
        '<p>Discover concerts, sports, theatre and more in ' + cityName + '</p>' +
        '</div>' +
        '<div class="view-header-selection">' +
        '<div class="current-selection-badge">' +
        '<img src="https://flagcdn.com/w40/' + countryCode.toLowerCase() + '.png" class="selection-flag">' +
        '<span>' + countryName + '</span>' +
        '<span class="selection-city">• ' + cityName + '</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="events-content" class="events-grid-layout"></div>';

    var eventsContent = document.getElementById("events-content");

    var url =
        `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&countryCode=${countryCode}&city=${encodeURIComponent(cityName)}`;
    ;

    fetch(url)
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {

            if (!data._embedded || !data._embedded.events) {
                eventsContent.innerHTML = "<p>No events found.</p>";
                return;
            }

            var events = data._embedded.events;

            for (var i = 0; i < events.length; i++) {
                var event = events[i];

                var image = event.images ? event.images[0].url : "";
                var name = event.name;
                var date = event.dates.start.localDate;
                var time = event.dates.start.localTime || "";
                var venue = event._embedded.venues[0].name;
                var category = event.classifications[0].segment.name;
                var buyUrl = event.url;
                eventsContent.innerHTML +=
                    '<div class="event-card">' +
                    '<div class="event-card-image">' +
                    '<img src="' + image + '" alt="' + name + '">' +
                    '<span class="event-card-category">' + category + '</span>' +
                    '<button class="event-card-save" ' +
'data-type="event" ' +
'data-title="' + name.replaceAll('"', '&quot;') + '" ' +
'data-subtitle="' + venue.replaceAll('"', '&quot;') + '" ' +
'data-date="' + (date + (time ? (' ' + time) : '')) + '" ' +
'data-country="' + countryName.replaceAll('"', '&quot;') + '" ' +
'data-city="' + cityName.replaceAll('"', '&quot;') + '">' +
'<i class="fa-regular fa-heart"></i></button>'
 +
                    '</div>' +
                    '<div class="event-card-body">' +
                    '<h3>' + name + '</h3>' +
                    '<div class="event-card-info">' +
                    '<div><i class="fa-regular fa-calendar"></i> ' + date + ' ' + time + '</div>' +
                    '<div><i class="fa-solid fa-location-dot"></i> ' + venue + ', ' + cityName + '</div>' +
                    '</div>' +
                    '<div class="event-card-footer">' +
                    '<button class="btn-event" ' +
'data-type="event" ' +
'data-title="' + name.replaceAll('"', '&quot;') + '" ' +
'data-subtitle="' + venue.replaceAll('"', '&quot;') + '" ' +
'data-date="' + (date + (time ? (' ' + time) : '')) + '" ' +
'data-country="' + countryName.replaceAll('"', '&quot;') + '" ' +
'data-city="' + cityName.replaceAll('"', '&quot;') + '">' +
'<i class="fa-regular fa-heart"></i> Save</button>' +
                    '<a href="' + buyUrl + '" target="_blank" class="btn-buy-ticket">' +
                    '<i class="fa-solid fa-ticket"></i> Buy Tickets' +
                    '</a>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
            }
        })
        .catch(function () {
            eventsContent.innerHTML = "<p>Error loading events.</p>";
        });
}

/*********************************
 * long weekends
 *********************************/
function loadLongWeekends(countryName, countryCode, year) {
    var lwDiv = document.getElementById("long-weekends-view"); 
    lwDiv.innerHTML = `
    <div class="view-header-card gradient-orange">
      <div class="view-header-icon"><i class="fa-solid fa-umbrella-beach"></i></div>
      <div class="view-header-content">
        <h2>Long Weekend Finder</h2>
        <p>Find holidays near weekends - perfect for planning mini-trips!</p>
      </div>
      <div class="view-header-selection">
        <div class="current-selection-badge" style="display:flex !important">
          <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png" alt="${countryName}" class="selection-flag">
          <span>${countryName}</span>
          <span class="selection-year">${year}</span>
        </div>
      </div>
    </div>
    <div id="lw-content" class="lw-grid"></div>
  `;

    var lwContent = document.getElementById("lw-content");

    // Fetch long weekends
    fetch("https://date.nager.at/api/v3/LongWeekend/" + year + "/" + countryCode)
        .then(function (res) {
            return res.json();
        })
        .then(function (data) {
            if (!data || data.length === 0) {
                lwContent.innerHTML = "<p>No long weekend data available.</p>";
                return;
            }

            lwContent.innerHTML = ""; // clear any previous content

            data.forEach(function (weekend, index) {
                var start = new Date(weekend.startDate);
                var end = new Date(weekend.endDate);

                var startDay = start.getDate();
                var startMonth = start.toLocaleString("en-US", { month: "short" });
                var endDay = end.getDate();
                var endMonth = end.toLocaleString("en-US", { month: "short" });

                // Determine badge type
                var badgeClass = weekend.extraDaysOffNeeded ? "warning" : "success";
                var infoText = weekend.extraDaysOffNeeded
                    ? "Requires taking " + weekend.extraDaysOffNeeded + " extra day(s) off"
                    : "No extra days off needed!";
                var msPerDay = 1000 * 60 * 60 * 24;
                var daysCount = Math.round((end - start) / msPerDay) + 1;
                // Visual days
                var daysVisualHTML = "";
                var current = new Date(start);
                while (current <= end) {
                    var isWeekend = current.getDay() === 0 || current.getDay() === 6;
                    daysVisualHTML +=
                        '<div class="lw-day ' + (isWeekend ? "weekend" : "") + '">' +
                        '<span class="name">' + current.toLocaleString("en-US", { weekday: "short" }) + '</span>' +
                        '<span class="num">' + current.getDate() + '</span>' +
                        '</div>';
                    current.setDate(current.getDate() + 1);
                }

                lwContent.innerHTML +=
                    '<div class="lw-card">' +
                    '<div class="lw-card-header">' +
                    '<span class="lw-badge"><i class="fa-solid fa-calendar-days"></i> ' + daysCount + ' Days</span>' +
                    '<button class="holiday-action-btn" ' +
'data-type="longweekend" ' +
'data-title="Long Weekend #' + (index + 1) + '" ' +
'data-subtitle="' + startMonth + ' ' + startDay + ' - ' + endMonth + ' ' + endDay + '" ' +
'data-date="' + year + ' ' + startMonth + ' ' + startDay + ' - ' + endMonth + ' ' + endDay + '" ' +
'data-country="' + countryName.replaceAll('"', '&quot;') + '" ' +
'data-city="">' +
'<i class="fa-regular fa-heart"></i></button>' +
                    '</div>' +
                    '<h3>Long Weekend #' + (index + 1) + '</h3>' +
                    '<div class="lw-dates"><i class="fa-regular fa-calendar"></i> ' + startMonth + ' ' + startDay + ' - ' + endMonth + ' ' + endDay + ', ' + year + '</div>' +
                    '<div class="lw-info-box ' + badgeClass + '"><i class="fa-solid ' + (badgeClass === "success" ? "fa-check-circle" : "fa-info-circle") + '"></i> ' + infoText + '</div>' +
                    '<div class="lw-days-visual">' + daysVisualHTML + '</div>' +
                    '</div>';
            });
        })
        .catch(function () {
            lwContent.innerHTML = "<p>Error loading long weekend data.</p>";
        });
}



/*********************************
 * weather
 *********************************/
const weatherDiv = document.getElementById("weather-view");

function getWeatherClass(weatherCode) {
    // Open-Meteo weather codes
    if (weatherCode === 0) return "weather-sunny";

    if ([1, 2, 3].includes(weatherCode)) return "weather-cloudy";

    if ([45, 48].includes(weatherCode)) return "weather-foggy";

    if ([51, 53, 55, 61, 63, 65, 80].includes(weatherCode))
        return "weather-rainy";

    if ([71, 73, 75].includes(weatherCode))
        return "weather-snowy";

    if ([95].includes(weatherCode))
        return "weather-stormy";

    return "weather-default";
}


function loadWeather(countryName, countryCode, cityName) {
    fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`)
        .then(res => res.json())
        .then(data => {
            const country = data[0];
            if (!country.capitalInfo || !country.capitalInfo.latlng) throw "No coordinates";
            const lat = country.capitalInfo.latlng[0];
            const lon = country.capitalInfo.latlng[1];
            const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
            return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,relativehumidity_2m,uv_index&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`)
                .then(res => res.json())
                .then(weatherData => ({ weatherData, countryName, flagUrl }));
        })
        .then(({ weatherData, countryName, flagUrl }) => {
            const current = weatherData.current_weather;
            const daily = weatherData.daily;
            const hourly = weatherData.hourly;

            // Format current date
            const weatherTime = new Date(current.time);
            const options = { weekday: "long", month: "long", day: "numeric" };
            const formattedDate = weatherTime.toLocaleDateString("en-US", options);

            // Map weather codes to icons and descriptions
            const weatherIcons = {
                0: ["fa-sun", "Clear sky"],
                1: ["fa-cloud-sun", "Mainly clear"],
                2: ["fa-cloud-sun", "Partly cloudy"],
                3: ["fa-cloud", "Overcast"],
                45: ["fa-smog", "Fog"],
                48: ["fa-smog", "Depositing rime fog"],
                51: ["fa-cloud-rain", "Drizzle light"],
                53: ["fa-cloud-rain", "Drizzle moderate"],
                55: ["fa-cloud-rain", "Drizzle dense"],
                61: ["fa-cloud-showers-heavy", "Rain slight"],
                63: ["fa-cloud-showers-heavy", "Rain moderate"],
                65: ["fa-cloud-showers-heavy", "Rain heavy"],
                71: ["fa-snowflake", "Snow slight"],
                73: ["fa-snowflake", "Snow moderate"],
                75: ["fa-snowflake", "Snow heavy"],
                80: ["fa-cloud-showers-heavy", "Rain showers"],
                95: ["fa-bolt", "Thunderstorm"],
            };

            const [currentIcon, currentDesc] = weatherIcons[current.weathercode] || ["fa-sun", "Clear"];
            const weatherClass = getWeatherClass(current.weathercode);


            // Build hourly forecast HTML (next 8 hours)
            let hourlyHTML = '';
            for (let i = 0; i < 8; i++) {
                const hour = new Date(hourly.time[i]);
                const hourLabel = i === 0 ? "Now" : hour.toLocaleTimeString("en-US", { hour: 'numeric', hour12: true });
                const [icon] = weatherIcons[hourly.weathercode[i]] || ["fa-sun"];
                hourlyHTML += `
                <div class="hourly-item ${i === 0 ? "now" : ""}">
                    <span class="hourly-time">${hourLabel}</span>
                    <div class="hourly-icon"><i class="fa-solid ${icon}"></i></div>
                    <span class="hourly-temp">${Number(hourly.temperature_2m[i]).toFixed(0)}°</span>
                </div>`;
            }

            // Build 7-day forecast HTML
            let forecastHTML = '';
            for (let i = 0; i < daily.time.length; i++) {
                const day = new Date(daily.time[i]);
                const dayLabel = i === 0 ? "Today" : day.toLocaleDateString("en-US", { weekday: "short" });
                const dayDate = day.toLocaleDateString("en-US", { day: "numeric", month: "short" });
                const [icon] = weatherIcons[daily.weathercode[i]] || ["fa-sun"];
                const precip = daily.precipitation_sum[i] || 0;

                forecastHTML += `
                <div class="forecast-day ${i === 0 ? "today" : ""}">
                    <div class="forecast-day-name"><span class="day-label">${dayLabel}</span><span class="day-date">${dayDate}</span></div>
                    <div class="forecast-icon"><i class="fa-solid ${icon}"></i></div>
                    <div class="forecast-temps"><span class="temp-max">${Number(daily.temperature_2m_max[i]).toFixed(0)}°</span>
                    <span class="temp-min">${Number(daily.temperature_2m_min[i]).toFixed(0)}°</span></div>
                    <div class="forecast-precip"><i class="fa-solid fa-droplet"></i><span>${precip}%</span></div>
                </div>`;
            }

            // Get current humidity and UV index (from hourly data closest to now)
            const currentHourIndex = hourly.time.findIndex(t => t === current.time);
            const humidity = currentHourIndex !== -1 ? hourly.relativehumidity_2m[currentHourIndex] : 'N/A';
            const uvIndex = currentHourIndex !== -1 ? hourly.uv_index[currentHourIndex] : 'N/A';

            // Render full HTML
            weatherDiv.innerHTML = `
            
            <div class="view-header-card  gradient-blue">
                <div class="view-header-icon"><i class="fa-solid fa-cloud-sun"></i></div>
                <div class="view-header-content">
                    <h2>Weather Forecast</h2>
                    <p>Check 7-day weather forecasts for ${cityName}</p>
                </div>
                <div class="view-header-selection">
                    <div class="current-selection-badge">
                        <img src="${flagUrl}" alt="${countryName}" class="selection-flag">
                        <span>${countryName}</span>
                        <span class="selection-city"> ${cityName}</span>
                    </div>
                </div>
            </div>

            <div class="weather-hero-card ${weatherClass}">
                <div class="weather-location">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${cityName}</span>
                    <span class="weather-time">${formattedDate}</span>
                </div>
                <div class="weather-hero-main">
                    <div class="weather-hero-left">
                        <div class="weather-hero-icon"><i class="fa-solid ${currentIcon}"></i></div>
                        <div class="weather-hero-temp">
                            <span class="temp-value">${Number(current.temperature).toFixed(0)}</span>
                            <span class="temp-unit">°C</span>
                        </div>
                    </div>
                    <div class="weather-hero-right">
                        <div class="weather-condition">${currentDesc}</div>
                        <div class="weather-feels">Wind ${current.windspeed} km/h</div>
                        <div class="weather-high-low">
                            <span class="high"><i class="fa-solid fa-arrow-up"></i> ${Math.max(...daily.temperature_2m_max)}°</span>
                            <span class="low"><i class="fa-solid fa-arrow-down"></i> ${Math.min(...daily.temperature_2m_min)}°</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="weather-details-grid">
                <div class="weather-detail-card">
                    <div class="detail-icon humidity"><i class="fa-solid fa-droplet"></i></div>
                    <div class="detail-info">
                        <span class="detail-label">Humidity</span>
                        <span class="detail-value">${humidity}%</span>
                    </div>
                </div>
                <div class="weather-detail-card">
                    <div class="detail-icon wind"><i class="fa-solid fa-wind"></i></div>
                    <div class="detail-info">
                        <span class="detail-label">Wind</span>
                        <span class="detail-value">${current.windspeed} km/h</span>
                    </div>
                </div>
                <div class="weather-detail-card">
                    <div class="detail-icon uv"><i class="fa-solid fa-sun"></i></div>
                    <div class="detail-info">
                        <span class="detail-label">UV Index</span>
                        <span class="detail-value">${uvIndex}</span>
                    </div>
                </div>
                <div class="weather-detail-card">
                    <div class="detail-icon precip"><i class="fa-solid fa-cloud-rain"></i></div>
                    <div class="detail-info">
                        <span class="detail-label">Precipitation</span>
                        <span class="detail-value">${daily.precipitation_sum[0]}%</span>
                    </div>
                </div>
            </div>

            <div class="weather-section">
                <h3 class="weather-section-title"><i class="fa-solid fa-clock"></i> Hourly Forecast</h3>
                <div class="hourly-scroll">
                    ${hourlyHTML}
                </div>
            </div>

            <div class="weather-section">
                <h3 class="weather-section-title"><i class="fa-solid fa-calendar-week"></i> 7-Day Forecast</h3>
                <div class="forecast-list">
                    ${forecastHTML}
                </div>
            </div>`;
        })
        .catch(err => {
            weatherDiv.innerHTML = `<p>Error loading weather data.</p>`;
            console.error(err);
        });
}




/*********************************
 * CONVERT CURRENCY
 *********************************/
const API_KEY = "9fd2d92817f32458a717f213";
const API_BASE = "https://v6.exchangerate-api.com/v6";

const amountInput = document.getElementById("currency-amount");
const fromSelect = document.getElementById("currency-from");
const toSelect = document.getElementById("currency-to");
const convertBtn = document.getElementById("convert-btn");
const swapBtn = document.getElementById("swap-currencies-btn");

const resultBox = document.getElementById("currency-result");
const popularGrid = document.getElementById("popular-currencies");

const fromAmountEl = resultBox.querySelector(".conversion-from .amount");
const fromCodeEl = resultBox.querySelector(".conversion-from .currency-code");
const toAmountEl = resultBox.querySelector(".conversion-to .amount");
const toCodeEl = resultBox.querySelector(".conversion-to .currency-code");
const rateInfoEl = resultBox.querySelector(".exchange-rate-info p");
const updatedEl = resultBox.querySelector(".exchange-rate-info small");

async function getRates(baseCurrency) {
    const response = await fetch(
        `${API_BASE}/${API_KEY}/latest/${baseCurrency}`
    );

    if (!response.ok) {
        throw new Error("API Error");
    }

    return response.json();
}

async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (!amount || amount <= 0) {
        showToast("Please enter a valid amount");
        return;
    }

    if (!from || !to) {
        showToast("Please select both currencies");
        return;
    }

    try {
        const data = await getRates(from);

        if (!data.conversion_rates || !data.conversion_rates[to]) {
            showToast("Conversion rate not available");
            return;
        }

        const rate = data.conversion_rates[to];
        const result = amount * rate;

        fromAmountEl.textContent = amount.toFixed(2);
        fromCodeEl.textContent = from;

        toAmountEl.textContent = result.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        toCodeEl.textContent = to;

        rateInfoEl.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;

        updatedEl.textContent =
            "Last updated: " +
            new Date(data.time_last_update_unix * 1000).toDateString();

        showToast("Conversion successful");
        loadPopularCurrencies();

    } catch (error) {
        showToast("Failed to load exchange rates");
        console.error(error);
    }
}



swapBtn.addEventListener("click", () => {
    const from = fromSelect.value;
    const to = toSelect.value;

    if (!from || !to) {
        showToast("Please select both currencies first");
        return;
    }

    fromSelect.value = to;
    toSelect.value = from;
});

convertBtn.addEventListener("click", convertCurrency);




async function loadPopularCurrencies() {
    const popular = ["EUR", "GBP", "EGP", "AED", "SAR", "JPY", "CAD", "INR"];
    try {
        const data = await getRates("USD");
        popularGrid.innerHTML = "";

        popular.forEach(code => {
            const rate = data.conversion_rates[code];

            popularGrid.innerHTML += `
        <div class="popular-currency-card">
          <img src="https://flagcdn.com/w40/${code
                    .slice(0, 2)
                    .toLowerCase()}.png" class="flag">
          <div class="info">
            <div class="code">${code}</div>
            <div class="name">${code}</div>
          </div>
          <div class="rate">${rate.toFixed(4)}</div>
        </div>
      `;
        });

    } catch (error) {
        console.error("Failed to load popular currencies", error);
    }
}

/*********************************
 * Sunrise & Sunset Times
 *********************************/

const sunDiv = document.getElementById("sun-times-view");


function formatTime(isoTime) {
    return new Date(isoTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return {
        day: d.toLocaleDateString("en-US", { weekday: "long" }),
        date: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    };
}

function secondsToHM(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

async function loadSunTimes(countryCode, countryName, cityName) {
    try {
    
        const countryRes = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const countryData = await countryRes.json();

        const lat = countryData[0].capitalInfo.latlng[0];
        const lng = countryData[0].capitalInfo.latlng[1];

        const today = new Date().toISOString().split("T")[0];

    
        const res = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${today}&formatted=0`
        );
        const data = await res.json();

        if (data.status !== "OK") throw "Sun API error";

        const s = data.results;


        const sunrise = formatTime(s.sunrise);
        const sunset = formatTime(s.sunset);
        const dawn = formatTime(s.civil_twilight_begin);
        const dusk = formatTime(s.civil_twilight_end);
        const solarNoon = formatTime(s.solar_noon);
        const dayLength = secondsToHM(s.day_length);

        const daylightPercent = ((s.day_length / 86400) * 100).toFixed(1);
        const darkLength = secondsToHM(86400 - s.day_length);

        const { day, date } = formatDate(today);
        const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

        sunDiv.innerHTML = ` <div class="view-header-card gradient-sunset">
            <div class="view-header-icon"><i class="fa-solid fa-sun"></i></div>
            <div class="view-header-content">
              <h2>Sunrise & Sunset Times</h2>
              <p>Plan your activities around golden hour - perfect for photographers</p>
            </div>
            <div class="view-header-selection">
              <div class="current-selection-badge">
                <img src="https://flagcdn.com/w40/${countryCode.toLowerCase()}.png" alt="${countryName}" class="selection-flag">
                <span>${countryName}</span>
                <span class="selection-city">• ${cityName}</span>
              </div>
            </div>
          </div>

    <div class="sun-main-card">
      <div class="sun-main-header">
        <div class="sun-location">
          <h2><i class="fa-solid fa-location-dot"></i> ${cityName}</h2>
          <p>Sun times for your selected location</p>
        </div>
        <div class="sun-date-display">
          <div class="date">${date}</div>
          <div class="day">${day}</div>
        </div>
      </div>

      <div class="sun-times-grid">
        <div class="sun-time-card dawn">
          <div class="icon"><i class="fa-solid fa-moon"></i></div>
          <div class="label">Dawn</div>
          <div class="time">${dawn}</div>
          <div class="sub-label">Civil Twilight</div>
        </div>

        <div class="sun-time-card sunrise">
          <div class="icon"><i class="fa-solid fa-sun"></i></div>
          <div class="label">Sunrise</div>
          <div class="time">${sunrise}</div>
          <div class="sub-label">Golden Hour Start</div>
        </div>

        <div class="sun-time-card noon">
          <div class="icon"><i class="fa-solid fa-sun"></i></div>
          <div class="label">Solar Noon</div>
          <div class="time">${solarNoon}</div>
          <div class="sub-label">Sun at Highest</div>
        </div>

        <div class="sun-time-card sunset">
          <div class="icon"><i class="fa-solid fa-sun"></i></div>
          <div class="label">Sunset</div>
          <div class="time">${sunset}</div>
          <div class="sub-label">Golden Hour End</div>
        </div>

        <div class="sun-time-card dusk">
          <div class="icon"><i class="fa-solid fa-moon"></i></div>
          <div class="label">Dusk</div>
          <div class="time">${dusk}</div>
          <div class="sub-label">Civil Twilight</div>
        </div>

        <div class="sun-time-card daylight">
          <div class="icon"><i class="fa-solid fa-hourglass-half"></i></div>
          <div class="label">Day Length</div>
          <div class="time">${dayLength}</div>
          <div class="sub-label">Total Daylight</div>
        </div>
      </div>
    </div>

    <div class="day-length-card">
      <h3><i class="fa-solid fa-chart-pie"></i> Daylight Distribution</h3>

      <div class="day-progress">
        <div class="day-progress-bar">
          <div class="day-progress-fill" style="width:${daylightPercent}%"></div>
        </div>
      </div>

      <div class="day-length-stats">
        <div class="day-stat">
          <div class="value">${dayLength}</div>
          <div class="label">Daylight</div>
        </div>
        <div class="day-stat">
          <div class="value">${daylightPercent}%</div>
          <div class="label">of 24 Hours</div>
        </div>
        <div class="day-stat">
          <div class="value">${darkLength}</div>
          <div class="label">Darkness</div>
        </div>
      </div>
      </div>
    </div>
    `;
    } catch (err) {
        sunDiv.innerHTML = `<p>Error loading sun times</p>`;
        console.error(err);
    }
}
/*********************************
 * My Plans View
 *********************************/
document.addEventListener("DOMContentLoaded", () => {
  let savedPlans = JSON.parse(localStorage.getItem("savedPlans")) || [];
  let currentFilter = "all";

  function savePlans() {
    localStorage.setItem("savedPlans", JSON.stringify(savedPlans));
  }

  function formatTypeLabel(type) {
    if (type === "event") return "Event";
    if (type === "holiday") return "Holiday";
    if (type === "longweekend") return "Long Weekend";
    return type || "";
  }

  function formatTypeClass(type) {
    return type || "event";
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setActiveFilterButton(filter) {
    const buttons = document.querySelectorAll(".plan-filter");
    buttons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.filter === filter) btn.classList.add("active");
    });
  }

  function updateCounts() {
    const all = savedPlans.length;
    const holiday = savedPlans.filter((p) => p.type === "holiday").length;
    const event = savedPlans.filter((p) => p.type === "event").length;
    const lw = savedPlans.filter((p) => p.type === "longweekend").length;

    const elAll = document.getElementById("filter-all-count");
    const elHoliday = document.getElementById("filter-holiday-count");
    const elEvent = document.getElementById("filter-event-count");
    const elLw = document.getElementById("filter-lw-count");

    if (elAll) elAll.textContent = all;
    if (elHoliday) elHoliday.textContent = holiday;
    if (elEvent) elEvent.textContent = event;
    if (elLw) elLw.textContent = lw;
  }

  function renderPlans(filter = "all") {
    const container = document.getElementById("plans-content");
    if (!container) return;

    const filtered =
      filter === "all" ? savedPlans : savedPlans.filter((p) => p.type === filter);

    updateCounts();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-heart-crack"></i></div>
          <h3>No Saved Plans Yet</h3>
          <p>Save holidays, events or long weekends</p>
        </div>`;
      return;
    }

    container.innerHTML = "";

    filtered.forEach((plan) => {
      const typeClass = formatTypeClass(plan.type);
      const typeLabel = formatTypeLabel(plan.type);

      const locationText =
        plan.subtitle || plan.city || plan.country || "Unknown location";

      const dateText = plan.date || "Unknown date";

      container.innerHTML += `
        <div class="plan-card">
          <span class="plan-card-type ${escapeHtml(typeClass)}">${escapeHtml(typeLabel)}</span>

          <div class="plan-card-content">
            <h4>${escapeHtml(plan.title)}</h4>

            <div class="plan-card-details">
              <div>
                <i class="fa-regular fa-calendar"></i>
                ${escapeHtml(dateText)}
              </div>

              <div>
                <i class="fa-solid fa-location-dot"></i>
                ${escapeHtml(locationText)}
              </div>
            </div>

            <div class="plan-card-actions">
              <button class="btn-plan-remove" data-remove-id="${escapeHtml(plan.id)}">
                <i class="fa-solid fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }

  function addPlan(plan) {
    const exists = savedPlans.some(
      (p) => p.type === plan.type && p.title === plan.title && p.date === plan.date
    );

    if (exists) {
      showToast("Already saved ");
      return;
    }

    savedPlans.push(plan);
    savePlans();
    renderPlans(currentFilter);
    updateCounts();
    showToast("Saved to My Plans");
  }

  function removePlanById(id) {
    savedPlans = savedPlans.filter((p) => String(p.id) !== String(id));
    savePlans();
    renderPlans(currentFilter);
    updateCounts();
    showToast("Removed ✅");
  }

  
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-event, .event-card-save, .holiday-action-btn");
    if (!btn) return;

    const plan = {
      id: Date.now(),
      type: btn.dataset.type,
      title: btn.dataset.title,
      subtitle: btn.dataset.subtitle,
      date: btn.dataset.date,
      country: btn.dataset.country,
      city: btn.dataset.city || "",
    };

    addPlan(plan);

    const icon = btn.querySelector("i");
    if (icon) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    }
  });

  
  document.addEventListener("click", function (e) {
    const removeBtn = e.target.closest(".btn-plan-remove");
    if (!removeBtn) return;
    removePlanById(removeBtn.dataset.removeId);
  });

  
  document.getElementById("clear-all-plans-btn")?.addEventListener("click", () => {
    savedPlans = [];
    savePlans();
    currentFilter = "all";
    setActiveFilterButton("all");
    renderPlans(currentFilter);
    updateCounts();
    showToast("All plans cleared");
  });


  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".plan-filter");
    if (!btn) return;

    currentFilter = btn.dataset.filter || "all";
    setActiveFilterButton(currentFilter);
    renderPlans(currentFilter);
  });

  setActiveFilterButton("all");
  renderPlans(currentFilter);
});
