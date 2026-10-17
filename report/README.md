# SignBridge — Academic Case Study Report (LaTeX Source)

This directory contains the complete, professionally formatted LaTeX source code for the academic case study report:

**"SignBridge — Indian Sign Language Video Recognition"**

---

## 1. Directory Structure

```
D:\SignBridge\report\
├── main.tex                    # Master LaTeX document
├── references.bib              # Verified, peer-reviewed bibliography (BibTeX)
├── README.md                   # Compilation instructions and documentation
├── chapters/                   # Modular chapter source files
│   ├── 00_abstract.tex         # Abstract and Keywords
│   ├── 01_introduction.tex     # Chapter 1: Introduction (1.1 - 1.7)
│   ├── 02_literature_review.tex# Chapter 2: Literature Review
│   ├── 03_problem_analysis.tex # Chapter 3: Problem Analysis & Requirements (3.1 - 3.6)
│   ├── 04_system_design.tex    # Chapter 4: System Design & Architecture (4.1 - 4.7)
│   ├── 05_dataset_preprocessing.tex # Chapter 5: Dataset & Preprocessing (5.1 - 5.7)
│   ├── 06_methodology_models.tex    # Chapter 6: Methodology & Original Models (6.1 - 6.8)
│   ├── 07_system_implementation.tex # Chapter 7: System Implementation (7.1 - 7.9)
│   ├── 08_experiments_results.tex   # Chapter 8: Experimental Setup & Results (8.1 - 8.7)
│   ├── 09_discussion.tex       # Chapter 9: Results Discussion
│   ├── 10_challenges_limitations.tex # Chapter 10: Challenges & Limitations
│   ├── 11_conclusion_future_work.tex # Chapter 11: Conclusion & Future Work
│   └── 12_appendices.tex       # Appendices: API Reference & Reproducibility
└── figures/                    # Vector graphics and TikZ architectural diagrams
    ├── arch_overall.tex        # Overall System Architecture (Client, API, Preprocessing, Engine)
    ├── pipeline_flow.tex       # 5-Stage Inference Pipeline Flow
    ├── model_mobilenetv2.tex   # MobileNetV2 Frozen Transfer Learning Architecture
    ├── model_custom_cnn.tex    # Custom 2D CNN Baseline Architecture
    ├── model_cnn_lstm.tex      # CNN-LSTM Spatio-Temporal Sequence Architecture
    └── workflow_frontend.tex   # Frontend User Interaction & Mode Selection Workflow
```

---

## 2. Compilation Instructions

### Local Compilation (pdflatex + bibtex)

To resolve all cross-references, table of contents, list of figures/tables, and bibliography citations, run the following compilation sequence:

```bash
cd D:\SignBridge\report

# Pass 1: Generate auxiliary files (.aux)
pdflatex -interaction=nonstopmode main.tex

# Pass 2: Compile bibliography citations (.bbl)
bibtex main

# Pass 3: Integrate citations into document
pdflatex -interaction=nonstopmode main.tex

# Pass 4: Finalize cross-references and page numbering
pdflatex -interaction=nonstopmode main.tex
```

### Automated Compilation via `latexmk`

If `latexmk` is installed:

```bash
cd D:\SignBridge\report
latexmk -pdf -synctex=1 -interaction=nonstopmode main.tex
```

To clean intermediate build files (`.aux`, `.bbl`, `.blg`, `.log`, `.out`, `.toc`, `.lof`, `.lot`):
```bash
latexmk -c
```

---

## 3. Online Compilation (Overleaf)

The report is 100% self-contained and ready for instant compilation on [Overleaf](https://www.overleaf.com):

1. Compress the entire `report/` folder into a `.zip` archive.
2. In Overleaf, click **New Project** $\to$ **Upload Project** and select the `.zip` file.
3. Set the compiler to **pdfLaTeX** (default) and root document to `main.tex`.
4. Click **Recompile**; the PDF compiles cleanly with all TikZ vector graphics and citations.

---

## 4. Local Environment Note (Compiler Availability)

During local inspection on this host workstation, no local TeX engine (`pdflatex`, `xelatex`, `latexmk`, or `tectonic`) was detected in the Windows system `PATH`. 

To install a local LaTeX compiler on Windows:
- **Option A (MiKTeX)**: Download and run the Windows installer from [miktex.org](https://miktex.org/download). MiKTeX automatically downloads any missing LaTeX packages on demand.
- **Option B (TeX Live)**: Download and install TeX Live from [tug.org/texlive](https://www.tug.org/texlive/).
- **Option C (VS Code + Overleaf/Docker)**: Use the LaTeX Workshop extension in VS Code with a TeX container or compile directly on Overleaf.

---

## 5. Required LaTeX Packages

All packages used in `main.tex` are part of the standard `texlive-latex-base` and `texlive-latex-extra` distributions:

- `geometry` (margins and page dimensions)
- `setspace` (one-and-a-half line spacing)
- `amsmath`, `amssymb`, `amsfonts` (mathematical formulas)
- `tikz` (vector architectural diagrams)
- `booktabs`, `tabularx`, `array`, `multirow` (academic tables)
- `listings` (syntax-highlighted code blocks)
- `fancyhdr` (headers and footers)
- `hyperref` (clickable cross-references and citations)
- `cite` (standard IEEE-style numerical citations)
- `caption`, `subcaption` (figure and table captions)

---

## 6. Strict Exclusion of Lab Evaluation 2

In strict adherence to project specifications, this report **exclusively** documents the original SignBridge project (76-class dynamic ISL recognition across 1,166 video samples with MobileNetV2, Custom CNN, and CNN-LSTM models). 

All elements of the separate **Lab Evaluation 2** experiment (DCGAN data augmentation, synthetic image generation, 5-class subsets, GAN dashboards, and GAN metrics) are completely excluded from this report.
