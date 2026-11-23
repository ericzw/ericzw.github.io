# Zhongwei Qiu's Homepage

Personal academic website for Zhongwei Qiu, featuring research, publications, projects, experience, and news.

Website: [ericzw.github.io](https://ericzw.github.io/)

The site uses HTML, CSS, and JavaScript. Content is loaded from Markdown files at runtime; no build step or package installation is required.

## Update content

| File | Content |
| --- | --- |
| `data/home.md` | Biography |
| `data/news.md` | News, newest first |
| `data/publications.md` | Publications and paper links |
| `data/projects.md` | Projects and product deployments |
| `data/experience.md` | Professional and academic experience |
| `data/honors.md` | Honors and awards |
| `data/services.md` | Academic service |
| `index.html` | Page structure, profile details, contact links, and footer |
| `stylesheet.css` | Styling and responsive layout |
| `site.js` | Content loading and rendering |
| `assets/` | Profile photo, logos, project images, and paper assets |

Follow the existing formatting when editing content: `site.js` uses a custom parser rather than a full Markdown engine. Publication and project entries are separated by `---`.

To add news, prepend a line to `data/news.md`:

```markdown
- 2026.11: 🎉 [**PPSG**](https://ieeexplore.ieee.org/abstract/document/11803248) is accepted by **TIP**.
```

For publications, `@asset: folder-name` points to `assets/papers/folder-name/`, containing `thumbnail.png` and `metadata.json`. The metadata's `text` field supplies the abstract. Use `@featured` to feature an entry.

## Preview locally

With Python 3 installed, run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000). Use a local server because the site fetches its content over HTTP. Press `Ctrl+C` to stop the server.

## Publish with GitHub Pages

In the repository's **Settings → Pages**, configure **Deploy from a branch** with `main` and `/ (root)` as the source. With that configuration, commits pushed to `main` trigger publication:

```sh
git add <changed-files>
git commit -m "Update website content"
git push origin main
```

Check the repository's **Actions** tab for deployment progress. The live site may take a few minutes to update.
