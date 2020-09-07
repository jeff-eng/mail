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
    .then(() => {
      // Direct user to the sent mailbox after sending email
      load_mailbox('sent');
    });
  });

  // Handle when user clicks on Archive/Unarchive button
  document.querySelector('#archive-btn').addEventListener('click', () => {
    // Update server with email's archive status
    fetch(`/emails/${sessionStorage.getItem('email_id')}`, {
      method: 'PUT',
      body: JSON.stringify({
        // Takes the current archived status, invert it, and update server accordingly
        archived: (sessionStorage.getItem('archived') !== 'true')
      })
    })
    .then(() => {
      load_mailbox('inbox');
    });
  });

  document.querySelector('#reply-btn').addEventListener('click', () => {
    let emailContents = {
      timestamp: document.querySelector('#email-timestamp').textContent,
      sender: document.querySelector('#email-sender').textContent,
      subject: document.querySelector('#email-subject').textContent,
      body: document.querySelector('#email-body').textContent
    };
    reply_email(emailContents);

  });
});

function reply_email(originalEmail) {
  // Show compose view and hide the other views
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#displayemail-view').style.display = 'none';

  let subjectText = originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`;

  // Pre-fill the email input fields
  document.querySelector('h3').innerHTML = 'Email Reply';
  document.querySelector('#compose-recipients').value = originalEmail.sender;
  document.querySelector('#compose-subject').value = subjectText;
  document.querySelector('#compose-body').innerHTML = `\n\n"On ${originalEmail.timestamp} ${originalEmail.sender} wrote: &#10;${originalEmail.body}"`;
  document.querySelector('#compose-body').focus();
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#displayemail-view').style.display = 'none';

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

      // Listen for user clicking on email in inbox view
      emailElement.addEventListener('click', event => {
        let clickedElement = event.target;
        let email_id;        
        
        // Records the email ID on the clicked element (wherever it is clicked on)
        if (clickedElement.parentElement.dataset.id != null) {
          email_id = clickedElement.parentElement.dataset.id;
        } else {
          email_id = clickedElement.dataset.id;
        }
        // Show the display email view; hide the email list and compose views
        document.querySelector('#displayemail-view').style.display = 'block';
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';

        // Fetch the email contents using the ID, then display contents
        fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
          displayEmail(email, mailbox);
        });
      });

      // Add email to list of emails in inbox
      emailElement.innerHTML = `<p class="sender">${element.sender}</p><span class="timestamp">${element.timestamp}</span><p class="subject">${element.subject}</p>`;
      document.querySelector('#emails-view').appendChild(emailElement);
    });
  });
}

function displayEmail(email, mailbox) {
  // Update the DOM with the email contents
  document.querySelector('#email-subject').innerHTML = email.subject;
  document.querySelector('#email-timestamp').innerHTML = email.timestamp;
  document.querySelector('#email-sender').innerHTML = email.sender;
  document.querySelector('#email-body').innerHTML = email.body;
  document.querySelector('#email-recipients').innerHTML = email.recipients.join(', ');
  
  // Save the email ID and whether email is archived in session storage
  sessionStorage.setItem('email_id', email.id);
  sessionStorage.setItem('archived', email.archived);

  toggleArchive(mailbox, email.archived);

  if (email.read === false) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }
}

// Handles display of archive button and behavior based on email box and email archive value
function toggleArchive(mailbox, archivedStatus) {
  if (mailbox === 'sent') {
    document.querySelector('#archive-btn').style.display = 'none';
    return;
  }

  let archiveButtonText = archivedStatus ? 'Unarchive' : 'Archive';
  document.querySelector('#archive-btn').innerHTML = archiveButtonText;
}