import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <section className="contact section-padding" id="contact">
      <div className="container contact-container">
        <div className="contact-card glass-panel">
          <h2 className="section-title">Get In Touch</h2>
          <p className="contact-desc">
            I'm currently looking for new opportunities. Whether you have a question or just want to say hi, 
            I'll try my best to get back to you!
          </p>
          <a href="mailto:hello@example.com" className="btn-primary">Say Hello</a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
