document.addEventListener('DOMContentLoaded', () => {

    const width = 960;
    const height = 600;

    const svg = d3.select("#map-container").append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "auto");

    const path = d3.geoPath();
    let salesData;
    let us;

    // Load both datasets concurrently
    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
        d3.json("sales-reps.json")
    ]).then(([usData, repData]) => {
        us = usData;
        salesData = repData;

        // Map state names to their abbreviations for easier lookup
        const stateIdToAbbr = {};
        us.objects.states.geometries.forEach(geom => {
            stateIdToAbbr[geom.id] = stateNameToAbbr(geom.properties.name);
        });

        // Draw states
        svg.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .join("path")
            .attr("class", "state")
            .attr("d", path)
            .on("click", handleStateClick)
            .each(function(d) {
                d.abbr = stateIdToAbbr[d.id];
            });

        // Initial map coloring
        updateMap();

    }).catch(error => console.error("Error loading data:", error));

    // --- EVENT LISTENERS ---
    d3.selectAll('input[name="vertical"]').on('change', (event) => {
        document.querySelectorAll('.radio-button').forEach(label => label.classList.remove('checked'));
        event.target.parentElement.classList.add('checked');
        updateMap();
    });
    
    // Set initial checked state on load
    const initiallyChecked = document.querySelector('input[name="vertical"]:checked');
    if (initiallyChecked) {
        initiallyChecked.parentElement.classList.add('checked');
    }

    const closeModalButton = document.querySelector('.close-button');

    closeModalButton.onclick = () => {
        modal.classList.add('hidden');
    }
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.classList.add('hidden');
        }
    }

    document.addEventListener('click', (event) => {
        const stateMessage = document.getElementById('state-message');
        const modalRepInfo = document.getElementById('modal-rep-info');

        // Check if the click is outside the map and modal
        if (!event.target.closest('.state') && !event.target.closest('#state-info')) {
            stateMessage.style.display = 'block'; // Show the message
            modalRepInfo.innerHTML = ''; // Clear the representative info
            d3.selectAll('.state').classed('selected', false); // Remove state selection
        }
    });

    // --- FUNCTIONS ---
    function getSelectedVertical() {
        return document.querySelector('input[name="vertical"]:checked').value;
    }

    function updateMap() {
        const selectedVertical = getSelectedVertical();
        svg.selectAll(".state")
            .attr("class", d => {
                const stateAbbr = d.abbr;
                const hasData = salesData[stateAbbr] && salesData[stateAbbr][selectedVertical];
                return `state ${hasData ? 'has-data' : 'no-data'}`;
            });
    }


    function handleStateClick(event, d) {
        const selectedVertical = getSelectedVertical();
        const stateAbbr = d.abbr;

        const stateMessage = document.getElementById('state-message');
        const modalRepInfo = document.getElementById('modal-rep-info');
        modalRepInfo.innerHTML = ''; // Clear previous info

        const repData = salesData[stateAbbr] ? salesData[stateAbbr][selectedVertical] : null;

        if (repData) {
            const reps = Array.isArray(repData) ? repData : [repData];
            reps.forEach(rep => {
                const repCard = document.createElement('div');
                repCard.className = 'rep-card';
                repCard.innerHTML = `
                    <img src="${rep.Photo}" alt="${rep.Name}" class="rep-photo">
                    <div class="rep-info">
                        <p class="rep-name">${rep.Name}</p>
                        <p class="rep-phone">${rep.Phone}</p>
                        <p class="rep-contact">${rep.Email}</p>
                        
                    </div>
                `;
                modalRepInfo.appendChild(repCard);
            });
        } else {
            modalRepInfo.innerHTML = '<p>No representative assigned for this vertical.</p>';
        }

        // Hide the "Select a state" message
        stateMessage.style.display = 'none';

        // Highlight the selected state
        d3.selectAll('.state').classed('selected', false); // Remove previous selection
        d3.select(event.target).classed('selected', true);

        // Smooth scroll to the representative info box
        const stateInfoBox = document.getElementById('state-info');
        stateInfoBox.scrollIntoView({ behavior: 'smooth' });
    }


    // Helper to get abbreviation from full state name
    function stateNameToAbbr(name) {
        const states = { "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY" };
        return states[name] || '';
    }
});