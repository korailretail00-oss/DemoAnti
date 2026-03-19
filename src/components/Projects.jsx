import React from 'react';
import './Projects.css';

const Projects = () => {
  const projectData = [
    {
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with Next.js and Stripe integration.',
      tech: ['React', 'Node.js', 'Stripe'],
      link: '#',
      github: '#'
    },
    {
      title: 'Task Management App',
      description: 'A beautiful drag-and-drop kanban board to manage workflows seamlessly.',
      tech: ['TypeScript', 'React', 'Zustand'],
      link: '#',
      github: '#'
    },
    {
      title: 'Portfolio Design System',
      description: 'A collection of reusable, accessible UI components built with Vanilla CSS.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      link: '#',
      github: '#'
    }
  ];

  return (
    <section className="projects section-padding" id="projects">
      <div className="container">
        <h2 className="section-title">Featured Projects</h2>
        <div className="projects-grid">
          {projectData.map((project, idx) => (
            <div key={idx} className="project-card glass-panel">
              <div className="project-image-placeholder">
                <span>{project.title} Preview</span>
              </div>
              <div className="project-info">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-tech">
                  {project.tech.map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>
                <div className="project-links">
                  <a href={project.github} className="link-btn">GitHub</a>
                  <a href={project.link} className="link-btn primary">Live Demo</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
