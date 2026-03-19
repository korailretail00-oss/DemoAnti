import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-logo">
          Dev.<span>Profile</span>
        </div>
        <p className="copyright">
          © {new Date().getFullYear()} OhMyDev. Built with React & Vanilla CSS.
        </p>
        <div className="footer-social">
          <a href="#">GH</a>
          <a href="#">LI</a>
          <a href="#">TW</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
