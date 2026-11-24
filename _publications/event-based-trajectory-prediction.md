---
layout: publication
title: "Controlled Evaluation of Temporal-Integration Mechanisms for Event-Based Trajectory Prediction"
type: preprint
date: 2026-01-01
when: "2026"
authors:
  - "Abdelkader Haddag"
  - "María P. Guerrero-Lebrero"
  - "Elisa Guerrero"
corresponding: "Elisa Guerrero"
venue: "Preprints"
publisher: "Preprints.org (MDPI)"
doi: "10.20944/preprints202609.1784.v1"
link: "https://www.preprints.org/manuscript/202609.1784"
linklabel: "Preprints.org manuscript"
keywords:
  - "Event cameras"
  - "Event-based vision"
  - "Continuous regression"
  - "Trajectory prediction"
  - "Temporal integration"
  - "Spiking neural networks"
  - "Recurrent neural networks"
abstract: "Continuous regression from event cameras depends critically on how temporal information is integrated, yet comparisons between temporal processing mechanisms are often confounded by differences in architecture, representation, and experimental protocol. This study presents a controlled comparison of temporal stacking, temporal convolution, gated recurrent integration, and recurrent leaky integrate-and-fire dynamics using causal multi-horizon prediction of continuous ball position from event-camera data. All configurations shared the same event representation, spatial processing framework, prediction targets, training protocol, and evaluation procedure. Gated recurrent models achieved the lowest localization errors, reaching approximately 16 px at 200 ms, with their advantage over feed-forward temporal mechanisms becoming more apparent as the prediction horizon increased. Motion analysis revealed a further distinction: gated recurrent models recovered 96.6–98.3% of the mean ground-truth displacement at 200 ms, whereas the spiking configurations recovered 62.5–71.2%. Changing the spiking readout did not reliably reduce this difference, and finer temporal discretization did not close the performance gap, while the evaluated gated recurrent model remained comparatively stable. These findings show that localization accuracy alone does not fully characterize continuous event-based prediction and that temporal integration affects both future localization and motion fidelity."
description: "Continuous regression from event cameras depends critically on how temporal information is integrated, yet comparisons between temporal processing…"
bibtex: |
  @misc{haddag2026controlled,
    title = {{Controlled Evaluation of Temporal-Integration Mechanisms for Event-Based Trajectory Prediction}},
    author = {Abdelkader Haddag and María P. Guerrero-Lebrero and Elisa Guerrero},
    year = {2026},
    howpublished = {Preprints},
    publisher = {Preprints.org (MDPI)},
    doi = {10.20944/preprints202609.1784.v1}
  }
---
