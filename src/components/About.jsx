import React from 'react';
import './About.css';

const About = () => {
  const skills = [
    { name: 'JavaScript', icon: '🟨' },
    { name: 'TypeScript', icon: '🟦' },
    { name: 'React', icon: '⚛️' },
    { name: 'Node.js', icon: '🟩' },
    { name: 'CSS/Sass', icon: '💅' },
    { name: 'Git', icon: '📦' }
  ];

  return (
    <section className="about section-padding" id="about">
      <div className="container">
        <h2 className="section-title">About Me</h2>
        <div className="about-content">
          <div className="about-text glass-panel">
            <h3>My Philosophy</h3>
            <p>
              I believe in building applications that are not only functionally robust but also visually captivating. 
              My journey in web development taught me the importance of performance, accessibility, and clean code.
            </p>
            <p>
              When I'm not coding, you can find me exploring new design trends, contributing to open-source, or writing about tech.
            </p>
          </div>
          <div className="about-skills glass-panel">
            <h3>Tech Stack</h3>
            <div className="skills-grid">
              {skills.map(skill => (
                <div key={skill.name} className="skill-item">
                  <span className="skill-icon">{skill.icon}</span>
                  <span className="skill-name">{skill.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
