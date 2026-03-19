import React from 'react';
import './Experience.css';

const Experience = () => {
  const experiences = [
    {
      period: '2022 - Present',
      role: 'Senior Front-End Developer',
      company: 'Tech Solutions Inc.',
      achievements: [
        'Spearheaded the migration of legacy architecture to Next.js, improving page load speeds by 40%.',
        'Mentored a team of 4 junior developers and established code review guidelines.',
        'Implemented a comprehensive design system using Storybook and Vanilla CSS.'
      ]
    },
    {
      period: '2019 - 2022',
      role: 'Web Developer',
      company: 'Creative Agency',
      achievements: [
        'Developed interactive promotional websites for high-profile clients.',
        'Collaborated closely with designers to ensure pixel-perfect implementation.',
        'Optimized web assets reducing bounce rate by 15%.'
      ]
    }
  ];

  return (
    <section className="experience section-padding" id="experience">
      <div className="container">
        <h2 className="section-title">Experience</h2>
        <div className="timeline">
          {experiences.map((exp, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content glass-panel">
                <span className="period">{exp.period}</span>
                <h3 className="role">{exp.role}</h3>
                <h4 className="company">{exp.company}</h4>
                <ul className="achievements">
                  {exp.achievements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
