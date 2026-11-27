---
title: "Our paper on event-based trajectory prediction is out in Sensors"
date: 2026-11-25
description: "We compared four ways of integrating time for predicting where a ball will go from an event camera. The study is now published, open access, in a special issue of Sensors."
---
We are glad to share that our paper, **[Controlled Evaluation of Temporal-Integration Mechanisms for Event-Based Trajectory Prediction]({{ '/research/contributions/event-based-trajectory-prediction/' | relative_url }})**, has been published in *Sensors* (MDPI), in the special issue *Event-Based Vision Technology: From Imaging to Perception and Control*.

This is a team effort, written with my co-authors María P. Guerrero-Lebrero and Elisa Guerrero from the University of Cádiz, and we are grateful for the time and ideas they put into it.

**What we asked.** Event cameras report changes in brightness instead of full frames, which makes them a natural fit for following fast motion. But when we predict where a moving object will be, results depend on how the model integrates information over time, and earlier comparisons often changed the architecture, the input representation and the training recipe all at once. We wanted a fair comparison, so we kept everything the same except the temporal mechanism: the same event representation, spatial processing, targets, training protocol and evaluation.

**What we compared.** We tested temporal stacking, temporal convolution, gated recurrent integration and recurrent leaky integrate-and-fire (spiking) dynamics on causal, multi-horizon prediction of a ball's position.

**What we found.**

- Gated recurrent models gave the lowest localisation errors, around 16 px at a 200 ms horizon, and their advantage over feed-forward mechanisms grew as the horizon got longer.
- They also recovered much more of the true motion: 96.6–98.3% of the mean ground-truth displacement at 200 ms, against 62.5–71.2% for the spiking configurations.
- Changing the spiking readout, or using a finer temporal discretisation, did not close that gap.

Our main message is that localisation error alone does not tell the whole story for continuous event-based prediction: how a model integrates time shapes both where it thinks the object will be and how faithfully it captures the motion.

The paper is open access. You can [read it in Sensors](https://doi.org/10.3390/s26237463), or find the details and a ready-to-copy citation on [its page here]({{ '/research/contributions/event-based-trajectory-prediction/' | relative_url }}).
