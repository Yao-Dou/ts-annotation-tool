This repo is organized as follows:
- `interface` - Interactive edit-based annotation interface
    - `iterface/tutoral` - In-depth tutorial
- `data` - SimpEval annotation data, see `data/readme.md`
- `analysis` - SimpEval analysis and visualization code
- `gpt-3` - Prompts & scripts to generate GPT simplification
- `edit_classification` - Training code for edit classification task
- `paper` - Visualizations used in final paper

To push an interface update please use the `gh-pages` branch:
`git subtree push --prefix interface origin gh-pages`