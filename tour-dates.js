// Dynamically load and render tour dates from CSV
// Requires PapaParse (CDN) or similar CSV parser

document.addEventListener('DOMContentLoaded', function() {
  const csvUrl = 'tour-dates.csv';
  const tourList = document.querySelector('#tour-dates-list ul');
  if (!tourList) return;

  function createTourItem(row) {
    const li = document.createElement('li');
    const showInfo = document.createElement('div');
    showInfo.className = 'show-info';
    const date = document.createElement('span');
    date.className = 'date';
    // Parse date as local (not UTC) to avoid off-by-one errors
    function parseLocalDate(dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const showDate = parseLocalDate(row.date);
    date.textContent = showDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const venue = document.createElement('span');
    venue.className = 'venue';
    venue.textContent = `${row.venue}, ${row.city}, ${row.state}`;
    showInfo.appendChild(date);
    showInfo.appendChild(venue);
    li.appendChild(showInfo);

    const now = new Date();
    const isPast = showDate < now.setHours(0,0,0,0);
    let linkType = null;
    let linkHref = null;
    let buttonText = null;
    let emailSubject = null;
    let isFree = false;
    if (!isPast && row.link_type === 'ticket' && row.link) {
      linkType = 'ticket';
      linkHref = row.link;
      buttonText = 'Tickets!';
    } else if (!isPast && row.link_type === 'email' && row.link) {
      linkType = 'email';
      const showDateStr = showDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      emailSubject = encodeURIComponent(`Tickets for ${row.venue} on ${showDateStr}`);
      linkHref = `mailto:${row.link}?subject=${emailSubject}`;
      buttonText = 'Email us for tickets!';
    } else if (!isPast && row.link_type === 'free') {
      isFree = true;
      buttonText = 'Free!';
    }
    if (isPast) {
      li.classList.add('past-show');
    } else if ((linkType && linkHref) || isFree) {
      li.classList.add('clickable-show');
      if (linkType && linkHref) {
        li.addEventListener('click', function(e) {
          if (e.target.tagName.toLowerCase() !== 'a') {
            if (linkType === 'ticket') {
              window.open(linkHref, '_blank', 'noopener');
            } else if (linkType === 'email') {
              window.location.href = linkHref;
            }
          }
        });
        li.title = buttonText;
        li.style.cursor = 'pointer';
      }
      // Add the button for visual consistency
      const showAction = document.createElement('div');
      showAction.className = 'show-action';
      if (isFree) {
        const span = document.createElement('span');
        span.className = 'ticket-button';
        span.textContent = buttonText;
        showAction.appendChild(span);
      } else {
        const a = document.createElement('a');
        a.className = 'ticket-button';
        a.textContent = buttonText;
        a.href = linkHref;
        if (linkType === 'ticket') {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        showAction.appendChild(a);
      }
      li.appendChild(showAction);
    }
    return li;
  }

  // Load CSV (using PapaParse from CDN)
  if (window.Papa) {
    Papa.parse(csvUrl, {
      header: true,
      download: true,
      complete: function(results) {
        tourList.innerHTML = '';
        results.data.forEach(row => {
          if (row.date && row.venue) {
            tourList.appendChild(createTourItem(row));
          }
        });
      }
    });
  } else {
    // PapaParse not loaded
    tourList.innerHTML = '<li>Could not load tour dates (CSV parser missing)</li>';
  }
});
