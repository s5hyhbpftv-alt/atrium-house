/* Build a mail draft locally. The visitor sends it from their own email app. */
(() => {
  const form = document.querySelector('#project-brief');
  const mailLink = document.querySelector('#brief-mail');
  if (!form || !mailLink) return;

  function updateDraft() {
    const fields = new FormData(form);
    const name = String(fields.get('name') || '').trim();
    const service = String(fields.get('service') || '').trim();
    const message = String(fields.get('message') || '').trim();
    const body = [
      'Здравствуйте, SHEERWOOD!',
      name ? `Меня зовут ${name}.` : '',
      `Направление: ${service}.`,
      message ? `О проекте:\n${message}` : '',
    ].filter(Boolean).join('\n\n');
    mailLink.href = 'mailto:hello@sheerwood.moscow?subject=' +
      encodeURIComponent('Проект: ' + service) + '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('input', updateDraft);
  form.addEventListener('change', updateDraft);
  // Enter inside a single-line field only prepares the draft; it does not send data.
  form.addEventListener('submit', event => {
    event.preventDefault();
    updateDraft();
    mailLink.focus();
  });
  updateDraft();
})();
