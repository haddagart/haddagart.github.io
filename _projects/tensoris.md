---
title: Tensoris
discipline: software
kind: Framework
status: ongoing
date: 2026-08-05
year: 2026
period: "2026"
version: "1.0.0"
license: MIT
summary: "A production-grade, academic-first PyTorch framework that connects peer-reviewed papers to reusable, reproducible code."
image: /assets/img/projects/tensoris.svg
accent: "#8B5CF6"
stack: [Python, PyTorch, Docker, uv]
topics: [Deep learning, Computer vision, NLP, Generative AI, Reproducible research]
links:
  - { label: Documentation, url: "https://haddagart.github.io/tensoris/", icon: file-text, primary: true }
  - { label: Repository, url: "https://github.com/haddagart/tensoris", icon: code }
  - { label: PyPI package, url: "https://pypi.org/project/tensoris/", icon: link }
---
Tensoris is a standardised architecture framework for AI researchers, scientific engineers and deep learning practitioners. It aims to close the gap between a peer-reviewed paper and code you can run: modular PyTorch components, each documented with its paper citation, in a project layout that stays reproducible from a laptop to a GPU container.

## What is inside

- **A three-tier layout.** `backend/` holds components, losses, metrics and trainers. `models/` holds end-to-end architectures. `data/` holds dataset loaders, and `lib/` holds utilities and diagnostics.
- **Domain building blocks.** Computer vision (ConvStem, ResidualBlock, FocalLoss, DiceLoss, MeanIoU, TopKAccuracy), natural language (PositionalEncoding, TransformerEncoderBlock, LabelSmoothingCrossEntropy, PerplexityMetric) and generative or multimodal work (VAE encoder and decoder blocks, ContrastiveInfoNCELoss, PerceptualLoss, FIDScoreMetric).
- **Ready-made workflows.** Environment diagnostics, training and evaluation scripts, a local documentation server and a GPU Docker container.
- **Agent skills.** Helpers for converting an existing project to the template, running hyperparameter sweeps, exporting checkpoints to ONNX and TorchScript, and turning paper equations into components with tests.
- **Integrations.** Hugging Face, Kaggle, Roboflow, Ultralytics YOLO and Weights & Biases.
- **Engineering around it.** Versioned documentation, pre-commit quality checks and automated releases to PyPI.

## Quick start

It needs Python 3.11 or newer. The recommended package manager is `uv`.

```bash
git clone https://github.com/haddagart/tensoris.git
cd tensoris
uv sync --all-groups
uv run python scripts/train.py --config inputs/experiments/default.yaml
```

Version 1.0.0 was released in August 2026 under the MIT licence. The documentation site lists the full API, tutorials, benchmarks and the guide for citing the project.

## Acknowledgements

Tensoris was built with AI pair programming, using Google's Gemini and Antigravity, as its documentation acknowledges.
