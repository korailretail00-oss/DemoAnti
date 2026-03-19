import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container hero-content">
        <div className="hero-text">
          <h2 className="greeting">Hello, world! I am</h2>
          <h1 className="name">Front-End Developer.</h1>
          <p className="bio">
            I craft seamless, high-performance web experiences.
            Specializing in modern JavaScript frameworks and stunning UI/UX design.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="btn-primary">View Projects</a>
            <a href="/resume.pdf" className="btn-secondary">Download Resume</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="blob-shape">
            <div className="avatar-placeholder">👨‍💻</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
