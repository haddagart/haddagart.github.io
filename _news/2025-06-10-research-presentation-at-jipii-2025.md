---
title: Research presentation at JIPII 2025
date: 2025-06-10
description: "Towards Recognizing Human Action in Videos using Spiking Neural Networks"
---
I recently had the opportunity to present my research at the **Fifth Doctoral Consortium in Computer Science (JIPII 2025)**, hosted by the *Escuela Superior de Ingeniería* at the Universidad de Cádiz. Although I joined online, it was a great experience to share ideas and connect with other PhD students and researchers working on diverse areas of computer science.

The work I presented is titled: **[“Towards Recognizing Human Action in Videos using Spiking Neural Networks”]({{ '/research/contributions/human-action-recognition-snn/' | relative_url }})**. Co-authored with **Elisa Guerrero Vázquez**, **María de la Paz Guerrero Lebrero**, and **Hayat Yedjour**.

Recognizing human actions in video is a fascinating yet tricky task. Videos come with all sorts of challenges — different lighting conditions, moving cameras, cluttered backgrounds, and variation in how people move. While deep learning has made great progress in this area, it's still **very resource-hungry**, especially when it comes to processing video data in real-time or on low-power devices.

That's where **Spiking Neural Networks (SNNs)** come in. These are bio-inspired models that mimic how neurons in the brain fire sparsely and only when needed — making them potentially **much more energy-efficient** than traditional deep networks.

In our approach, we tried to combine the best of both worlds:

- We first use a lightweight deep model to convert RGB video frames into **event-based streams** (more compact and time-aware representations).
- Then, we feed these into a **spiking neural network** trained using **surrogate gradients** — a training trick that helps SNNs learn more effectively.

The goal is to reduce redundancy, focus on meaningful temporal features, and ultimately recognize actions **with much less energy consumption** than typical methods.

This kind of work opens doors for bringing human activity recognition into real-world settings where resources are limited — like wearable devices, mobile robots, or smart home systems. It's also part of a broader movement in AI research to explore **neuromorphic and energy-aware computing** — something I'm personally very interested in.

<div style="position:relative;aspect-ratio:16/9;margin:1.75rem 0;border-radius:12px;overflow:hidden">
  <iframe src="https://www.youtube-nocookie.com/embed/uVGV9Xfv9L8?start=19620" title="Jornadas de Investigación Predoctoral en Ingeniería Informática (JIPPI 2025), Audiovisuales UCA TV" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
</div>

Please jump to **5:27:00** ([watch on YouTube](https://www.youtube.com/watch?v=uVGV9Xfv9L8&t=19620s)).

Although I couldn't attend in person, I was really glad to participate online and present the work to the community. JIPII is a fantastic event that brings together PhD students from different universities and fields, and it was inspiring to see the range of projects being developed.

This was an important milestone in my PhD journey and a nice opportunity to share what we've been working on. Thanks to my co-authors and everyone who attended or supported the talk!

If you're curious about the topic, feel free to reach out — I'd love to chat.

**Event:** JIPII 2025 – Fifth Doctoral Consortium in Computer Science<br>
**Hosted by:** Universidad de Cádiz<br>
**Website:** [jipii.uca.es](https://jipii.uca.es)
