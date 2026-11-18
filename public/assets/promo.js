// DEMO ONLY (audit-fail-demo): seeded unsafe code to prove the security gate blocks a deploy. Never merge.
// Writes the ?msg= URL parameter straight into the page as HTML (DOM XSS) and loads a script from another site.
var msg = new URLSearchParams(location.search).get('msg');
document.getElementById('main').innerHTML = '<p>' + msg + '</p>';
var s = document.createElement('script');
s.src = 'https://cdn.example-tracker.test/collect.js';
document.head.appendChild(s);
