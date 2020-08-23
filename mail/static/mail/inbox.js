document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Listen for submit event to send email to server
  document.querySelector('#compose-form').addEventListener('submit', event => {
    event.preventDefault();
  
    // Send POST request to server
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      // Direct user to the sent mailbox after sending email
      load_mailbox('sent');
    });
  });
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails for the requested mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Display emails for each mailbox
    emails.forEach(element => {
      let emailElement = document.createElement('div');
      emailElement.classList.add('email');

      if (element.read === true) {
        emailElement.classList.add('email-read');
      } else {
        emailElement.classList.add('email-unread');
      }

      emailElement.innerHTML = `<p class="sender">${element.sender}</p><span class="timestamp">${element.timestamp}</span><p class="subject">${element.subject}</p>`;
      document.querySelector('#emails-view').appendChild(emailElement);
    });
  });
}