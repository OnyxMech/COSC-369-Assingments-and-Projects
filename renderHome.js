async function renderHome() {
  const user = getUser();
  const canPost = user && (user.role === 'organizer' || user.role === 'admin');

  app.innerHTML = '<h2>Upcoming Events</h2><p>Loading...</p>';
  try {
    const { events } = await api('/events');
    const listHtml = !events.length
      ? '<p>No upcoming events yet.</p>'
      : events
          .map(
            (ev) => `
        <div class="card">
          <h3>${ev.title}</h3>
          <p class="meta">${new Date(ev.start_time).toLocaleString()} &middot; ${ev.location || 'TBD'} &middot; ${ev.category || 'Uncategorized'}</p>
          <p>${ev.description || ''}</p>
          <p class="meta">Organized by ${ev.organizer} &middot;
            ${ev.capacity ? (ev.rsvp_count >= ev.capacity ? '<span class="full">Full</span>' : `${ev.rsvp_count}/${ev.capacity} attending`) : `${ev.rsvp_count} attending`}
          </p>
        </div>`
          )
          .join('');

    app.innerHTML =
      '<h2>Upcoming Events</h2>' +
      (canPost ? '<button id="postEventBtn">+ Post an event</button>' : '') +
      '<div id="eventList">' + listHtml + '</div>';

    if (canPost) {
      document.getElementById('postEventBtn').onclick = renderPostEventForm;
    }
  } catch (err) {
    app.innerHTML = `<p class="error">Could not load events: ${err.message}</p>`;
  }
}
