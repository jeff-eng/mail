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
  document.querySelector('#displayemail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#displayemail-view').style.display = 'none';
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
      emailElement.setAttribute('data-id', `${element.id}`);

      // Add class for each email to visuall distinguish read vs. unread
      if (element.read === true) {
        emailElement.classList.add('email-read');
      } else {
        emailElement.classList.add('email-unread');
      }

      // Add event listener
      emailElement.addEventListener('click', event => {
        document.querySelector('#displayemail-view').style.display = 'block';
        let clickedElement = event.target;
        let email_id;        

        if (clickedElement.parentElement.dataset.id != null) {
          email_id = clickedElement.parentElement.dataset.id;
        } else {
          email_id = clickedElement.dataset.id;
        }
        // Hide the email list and compose views
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';

        // Fetch the email contents using the ID, then display the contents
        fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
          console.log(email);
          displayEmail(email);
        });
      });

      emailElement.innerHTML = `<p class="sender">${element.sender}</p><span class="timestamp">${element.timestamp}</span><p class="subject">${element.subject}</p>`;
      document.querySelector('#emails-view').appendChild(emailElement);
    });
  });
}

function displayEmail(email) {
  // Update the DOM with the email contents
  document.querySelector('#email-subject').innerHTML = email.subject;
  document.querySelector('#email-timestamp').innerHTML = email.timestamp;
  document.querySelector('#email-sender').innerHTML = email.sender;
  document.querySelector('#email-body').innerHTML = email.body;
  document.querySelector('#email-recipients').innerHTML = email.recipients.join(', ');
  
  // Update that email has been read only if it's currently showing as unread
  if (email.read === false) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }
}