/**
 * site.js - Lightweight Markdown content loader and renderer
 * Loads .md files from data/ directory and renders them into the page
 */

(function () {
  'use strict';

  // Simple Markdown parser (handles common patterns for academic content)
  function parseMd(md) {
    let html = md
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, '</p><p>')
      // Single newline in list context
      .replace(/\n/g, '<br>');

    return '<p>' + html + '</p>';
  }

  // Fetch a markdown file
  async function fetchMd(path) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) return '';
      return await resp.text();
    } catch (e) {
      console.warn('Failed to load:', path, e);
      return '';
    }
  }

  // Render the bio section
  function renderBio(md) {
    const container = document.getElementById('bio-content');
    if (!container || !md) return;

    const lines = md.trim().split('\n');
    let bioHtml = '';

    for (const line of lines) {
      if (line.trim()) {
        let processed = line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        bioHtml += `<p>${processed}</p>`;
      }
    }

    container.innerHTML = bioHtml;
  }

  // Render news list
  function renderNews(md) {
    const container = document.getElementById('news-list');
    if (!container || !md) return;

    const lines = md.trim().split('\n').filter(l => l.startsWith('- '));
    let html = '';
    for (const line of lines) {
      const content = line.slice(2);
      // Try to extract date pattern like "2026.06:" or "2025.06:"
      const dateMatch = content.match(/^(\d{4}\.\d{2}):\s*(.*)/);
      if (dateMatch) {
        const text = dateMatch[2].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html += `<li><span class="news-date">${dateMatch[1]}</span>${text}</li>`;
      } else {
        html += `<li>${content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`;
      }
    }
    container.innerHTML = html;
  }

  // Render publications
  function renderPublications(md) {
    const container = document.getElementById('publications-list');
    if (!container || !md) return;

    const entries = md.trim().split(/\n---\n/).filter(e => e.trim());
    let html = '';

    for (const entry of entries) {
      const lines = entry.trim().split('\n').filter(l => l.trim());
      if (lines.length < 3) continue;

      const title = lines[0].replace(/^#+\s*/, '');
      const authors = lines[1] || '';
      const venue = lines[2] || '';

      // Extract asset id and links
      let assetId = '';
      let links = '';
      for (let i = 3; i < lines.length; i++) {
        if (lines[i].startsWith('@asset:')) {
          assetId = lines[i].replace('@asset:', '').trim();
          continue;
        }
        const linkMatch = lines[i].match(/\[([^\]]+)\]\(([^)]+)\)/g);
        if (linkMatch) {
          for (const lm of linkMatch) {
            const parts = lm.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (parts) {
              links += `<a href="${parts[2]}" target="_blank">${parts[1]}</a>`;
            }
          }
        }
      }

      // Build thumbnail: try loading from asset folder
      const thumbPath = assetId ? `assets/papers/${assetId}/thumbnail.png` : '';
      const frameContent = assetId
        ? `<img src="${thumbPath}" alt="${title}" onerror="this.parentElement.innerHTML='<span class=media-frame-placeholder>${venue}</span>'">`
        : `<span class="media-frame-placeholder">${venue}</span>`;

      html += `
        <article class="panel media-item" data-asset="${assetId}">
          <div class="media-frame">
            ${frameContent}
          </div>
          <div class="media-body">
            <h3>${title}</h3>
            <p class="authors">${authors.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*/g, '<sup>*</sup>').replace(/✉/g, '<sup>✉</sup>').replace(/†/g, '<sup>†</sup>')}</p>
            <p class="venue">${venue}</p>
            <p class="abstract"></p>
            ${links ? `<div class="links">${links}</div>` : ''}
          </div>
        </article>`;
    }

    container.innerHTML = html;

    // Load abstracts from metadata.json
    container.querySelectorAll('article[data-asset]').forEach(article => {
      const asset = article.dataset.asset;
      if (!asset) return;
      fetch(`assets/papers/${asset}/metadata.json`)
        .then(r => r.ok ? r.json() : null)
        .then(meta => {
          if (meta && meta.text) {
            const p = article.querySelector('.abstract');
            if (p) p.textContent = meta.text;
          }
        })
        .catch(() => {});
    });
  }

  // Render projects
  function renderProjects(md) {
    const container = document.getElementById('projects-list');
    if (!container || !md) return;

    const entries = md.trim().split(/\n---\n/).filter(e => e.trim());
    let html = '';

    for (const entry of entries) {
      const lines = entry.trim().split('\n');
      if (lines.length < 2) continue;

      const title = lines[0].replace(/^#+\s*/, '');
      let role = '';
      let desc = '';
      let thumbnail = '';
      let links = '';

      for (let i = 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
          if (desc) desc += '<br>';
          continue;
        }
        if (trimmed.startsWith('@thumbnail:')) {
          thumbnail = trimmed.replace('@thumbnail:', '').trim();
          continue;
        }
        if (trimmed.match(/^\*\*Role\*\*:/)) {
          role = trimmed.replace(/^\*\*Role\*\*:\s*/, '');
          continue;
        }
        const linkMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/g);
        if (linkMatch) {
          for (const lm of linkMatch) {
            const parts = lm.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (parts) {
              links += `<a href="${parts[2]}" target="_blank">${parts[1]}</a>`;
            }
          }
          continue;
        }
        desc += (desc && !desc.endsWith('<br>') ? ' ' : '') + trimmed;
      }

      const frameContent = thumbnail
        ? `<img src="${thumbnail}" alt="${title}" onerror="this.parentElement.innerHTML='<span class=media-frame-placeholder>Project</span>'">`
        : `<span class="media-frame-placeholder">Project</span>`;

      html += `
        <article class="panel media-item">
          <div class="media-frame">
            ${frameContent}
          </div>
          <div class="media-body">
            <h3>${title}</h3>
            ${role ? `<p class="venue">${role}</p>` : ''}
            ${desc ? `<h4 class="project-about-heading">About</h4><p class="authors">${desc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>` : ''}
            ${links ? `<div class="links">${links}</div>` : ''}
          </div>
        </article>`;
    }

    container.innerHTML = html;
  }

  // Render experience
  function renderExperience(md) {
    const container = document.getElementById('experience-content');
    if (!container || !md) return;

    let html = '';
    const lines = md.trim().split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) html += '</ul>';
        html += `<h3>${line.replace(/^#+\s*/, '')}</h3><ul>`;
        currentSection = line;
      } else if (line.startsWith('- ')) {
        const content = line.slice(2);
        // Try to bold the period part
        const periodMatch = content.match(/^(\d{4}[\s\S]*?),\s*(.*)/);
        if (periodMatch) {
          html += `<li><span class="exp-period">${periodMatch[1]}</span>, ${periodMatch[2]}</li>`;
        } else {
          html += `<li>${content}</li>`;
        }
      }
    }
    if (currentSection) html += '</ul>';

    container.innerHTML = html;
  }

  // Render honors
  function renderHonors(md) {
    const container = document.getElementById('honors-list');
    if (!container || !md) return;

    const lines = md.trim().split('\n').filter(l => l.startsWith('- '));
    let html = '';
    for (const line of lines) {
      html += `<li>${line.slice(2)}</li>`;
    }
    container.innerHTML = html;
  }

  // Render service
  function renderService(md) {
    const container = document.getElementById('service-content');
    if (!container || !md) return;

    let html = '';
    const lines = md.trim().split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) html += '</ul>';
        html += `<h3>${line.replace(/^#+\s*/, '')}</h3><ul>`;
        currentSection = line;
      } else if (line.startsWith('- ')) {
        html += `<li>${line.slice(2)}</li>`;
      } else if (line.trim() && !line.startsWith('#')) {
        html += `<p>${line}</p>`;
      }
    }
    if (currentSection) html += '</ul>';

    container.innerHTML = html;
  }

  // Main initialization
  async function init() {
    const [home, news, publications, projects, experience, honors, services] = await Promise.all([
      fetchMd('data/home.md'),
      fetchMd('data/news.md'),
      fetchMd('data/publications.md'),
      fetchMd('data/projects.md'),
      fetchMd('data/experience.md'),
      fetchMd('data/honors.md'),
      fetchMd('data/services.md')
    ]);

    renderBio(home);
    renderNews(news);
    renderPublications(publications);
    renderProjects(projects);
    renderExperience(experience);
    renderHonors(honors);
    renderService(services);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
