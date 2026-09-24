// funnel.js — shared call-form funnel tracking, loaded on every public page.
// Sends form_started the first time a phone field gets focus, and
// form_submitted when a form containing a phone field is submitted (or
// payment.html's #startBtn is clicked). Each event fires at most once per
// page view. Never blocks or alters the form's own handlers.
(function () {
  var sent = {};
  var sessionId;
  try {
    sessionId = sessionStorage.getItem('twi_sid');
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('twi_sid', sessionId);
    }
  } catch (e) {
    sessionId = '';
  }

  function track(event) {
    if (sent[event]) return;
    sent[event] = true;
    var payload = JSON.stringify({ event: event, page: location.pathname, sessionId: sessionId });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/track', payload)) return;
    } catch (e) {}
    try {
      fetch('/api/track', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'text/plain' } });
    } catch (e) {}
  }

  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.matches && e.target.matches('input[type="tel"]')) track('form_started');
  }, true);

  document.addEventListener('submit', function (e) {
    if (e.target && e.target.querySelector && e.target.querySelector('input[type="tel"]')) track('form_submitted');
  }, true);

  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#startBtn')) track('form_submitted');
  }, true);
})();
