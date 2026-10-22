/* C&T Productions
 * Save beside index.html and style.css. No libraries required.
 * The inquiry form downloads a draft; it does not send customer information.
 */

(() => {
  'use strict';

  function initialize() {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => [...document.querySelectorAll(selector)];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionToggle = $('.motion-toggle');
    let userPaused = false;

    const motionIsOff = () => userPaused || reducedMotion.matches;
    const scrollBehavior = () => motionIsOff() ? 'instant' : 'smooth';

    // Motion preference also controls CSS animations and transitions.
    function updateMotion() {
      document.body.classList.toggle('no-motion', motionIsOff());
      if (motionToggle) {
        motionToggle.setAttribute('aria-pressed', String(motionIsOff()));
        motionToggle.textContent = reducedMotion.matches
          ? 'Reduced motion enabled'
          : userPaused ? 'Resume motion' : 'Pause motion';
        motionToggle.disabled = reducedMotion.matches;
      }
    }

    motionToggle?.addEventListener('click', () => {
      userPaused = !userPaused;
      updateMotion();
    });
    reducedMotion.addEventListener('change', updateMotion);
    updateMotion();

    // Progressive enhancement: content stays visible without JavaScript.
    if ('IntersectionObserver' in window) {
      const reveals = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          reveals.unobserve(entry.target);
        });
      }, { threshold: 0.08 });

      document.documentElement.classList.add('js');
      $$('.reveal').forEach((element) => reveals.observe(element));
    }

    // Mobile navigation: close after selection, outside click, or Escape.
    const menu = $('.menu');
    const navigation = $('#navigation');

    function setMenu(open) {
      if (!menu || !navigation) return;
      navigation.classList.toggle('open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? 'Close −' : 'Menu +';
    }

    menu?.addEventListener('click', () => {
      setMenu(menu.getAttribute('aria-expanded') !== 'true');
    });
    navigation?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navigation?.classList.contains('open')) {
        setMenu(false);
        menu?.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!navigation?.contains(event.target) && !menu?.contains(event.target)) {
        setMenu(false);
      }
    });
    window.matchMedia('(min-width: 561px)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });

    // Package carousel: arrows, dots, keyboard navigation, and native touch swipe.
    const rail = $('.rail');
    const cards = rail ? [...rail.querySelectorAll('.package')] : [];
    const dots = $$('.dot');
    const previous = $('#previous');
    const next = $('#next');
    let currentPackage = 0;
    let requestedPackage = null;
    let settleTimer;

    if (rail && cards.length) {
      function cardPosition(index) {
        const padding = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
        const position = cards[index].getBoundingClientRect().left
          - rail.getBoundingClientRect().left + rail.scrollLeft - padding;
        return Math.max(0, Math.min(position, rail.scrollWidth - rail.clientWidth));
      }

      function updateControls(index) {
        dots.forEach((dot, dotIndex) => {
          dot.setAttribute('aria-current', String(dotIndex === index));
        });
        if (previous) previous.disabled = index === 0;
        if (next) next.disabled = index === cards.length - 1;
      }

      function syncCarousel() {
        currentPackage = cards.reduce((closest, card, index) => {
          return Math.abs(cardPosition(index) - rail.scrollLeft)
            < Math.abs(cardPosition(closest) - rail.scrollLeft) ? index : closest;
        }, 0);
        updateControls(requestedPackage ?? currentPackage);
      }

      function finishScroll() {
        requestedPackage = null;
        syncCarousel();
      }

      function goToPackage(index) {
        requestedPackage = Math.max(0, Math.min(index, cards.length - 1));
        updateControls(requestedPackage);
        rail.scrollTo({ left: cardPosition(requestedPackage), behavior: scrollBehavior() });
        clearTimeout(settleTimer);
        settleTimer = setTimeout(finishScroll, 700);
      }

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToPackage(index));
      });
      previous?.addEventListener('click', () => {
        goToPackage((requestedPackage ?? currentPackage) - 1);
      });
      next?.addEventListener('click', () => {
        goToPackage((requestedPackage ?? currentPackage) + 1);
      });
      rail.addEventListener('scroll', () => {
        syncCarousel();
        clearTimeout(settleTimer);
        settleTimer = setTimeout(finishScroll, 180);
      }, { passive: true });
      rail.addEventListener('pointerdown', () => { requestedPackage = null; });
      rail.addEventListener('wheel', () => { requestedPackage = null; }, { passive: true });
      rail.addEventListener('keydown', (event) => {
        if (event.target !== rail) return;
        const index = requestedPackage ?? currentPackage;
        const destinations = {
          ArrowLeft: index - 1,
          ArrowRight: index + 1,
          Home: 0,
          End: cards.length - 1
        };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        goToPackage(destinations[event.key]);
      });
      window.addEventListener('resize', finishScroll);
      window.addEventListener('load', syncCarousel, { once: true });
      syncCarousel();
    }

    // Expand the package comparison table.
    const compare = $('.compare');
    const comparison = $('#comparison');
    compare?.addEventListener('click', () => {
      if (!comparison) return;
      comparison.hidden = !comparison.hidden;
      compare.setAttribute('aria-expanded', String(!comparison.hidden));
      compare.textContent = comparison.hidden
        ? 'Compare all features +' : 'Close comparison −';
    });

    // Premium showcase tabs share one panel and an animated website mockup.
    const features = {
      design: {
        number: '01 / Advanced design & layout',
        title: 'Space to make an impression.',
        description: 'Distinctive typography. Intentional spacing. A visual rhythm that gives your business room to be itself, and helps visitors find what matters.'
      },
      mobile: {
        number: '02 / Mobile-friendly design',
        title: 'A smaller screen. The same care.',
        description: 'A layout that adapts to the way people browse. Readable content, comfortable controls, and a clear path to get in touch, wherever your customers are.'
      },
      content: {
        number: '03 / Expanded content sections',
        title: 'Give your story some space.',
        description: 'Show the services, people, and details that make your business yours. Premium gives your content more room, with sections organized around what your customers need.'
      }
    };
    const tabs = $$('[data-feature]');
    const panel = $('#feature-panel');
    const demo = $('.demo-window');

    function selectFeature(tab) {
      const key = tab.dataset.feature;
      const feature = features[key];
      if (!feature || !panel) return;

      tabs.forEach((item) => {
        item.setAttribute('aria-selected', String(item === tab));
        item.tabIndex = item === tab ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tab.id);
      $('#feature-number').textContent = feature.number;
      $('#feature-title').textContent = feature.title;
      $('#feature-description').textContent = feature.description;
      if (demo) {
        demo.classList.remove('design', 'mobile', 'content');
        demo.classList.add(key);
      }
      const extraPanel = $('.demo-bars div:last-child');
      if (extraPanel) extraPanel.hidden = key !== 'content';
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectFeature(tab));
      tab.addEventListener('keydown', (event) => {
        const destinations = {
          ArrowRight: (index + 1) % tabs.length,
          ArrowLeft: (index + tabs.length - 1) % tabs.length,
          Home: 0,
          End: tabs.length - 1
        };
        if (!(event.key in destinations)) return;
        event.preventDefault();
        const target = tabs[destinations[event.key]];
        target.focus();
        selectFeature(target);
      });
    });

    // Package data mirrors the supplied package document.
    const basicFeatures = [
      'Custom website',
      'Mobile-friendly design',
      'Contact & business information',
      'Basic search engine setup'
    ];
    const premiumFeatures = [
      ...basicFeatures,
      'Professional photography',
      'Advanced design & layout',
      'Expanded content sections'
    ];
    const packages = {
      Basic: { price: '$750–$1,000', features: basicFeatures },
      Premium: { price: '$1,500', features: premiumFeatures },
      'Premium + Chatbot': {
        price: '$2,000',
        features: [
          ...premiumFeatures,
          'AI customer chatbot',
          '24/7 automated answers',
          'Business-specific AI knowledge',
          'Lead & inquiry assistance'
        ]
      }
    };
    const dialog = $('#package-dialog');
    const interest = $('#interest');
    let selectedPackage = 'Premium';
    let dialogTrigger;

    if (dialog) {
      dialog.setAttribute('aria-labelledby', 'dialog-title');
      $$('.explore').forEach((button) => {
        button.addEventListener('click', () => {
          const selection = packages[button.dataset.package];
          if (!selection) return;
          selectedPackage = button.dataset.package;
          dialogTrigger = button;
          $('#dialog-title').textContent = selectedPackage;
          $('#dialog-price').textContent = selection.price;
          $('#dialog-features').replaceChildren(...selection.features.map((text) => {
            const item = document.createElement('li');
            item.textContent = text;
            return item;
          }));
          dialog.showModal();
        });
      });
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right
          || event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (outside) dialog.close();
      });
      dialog.addEventListener('close', () => dialogTrigger?.focus({ preventScroll: true }));
    }
    $('#dialog-start')?.addEventListener('click', () => {
      if (interest) interest.value = selectedPackage;
      // Let the contact link keep focus instead of returning to the dialog trigger.
      dialogTrigger = null;
      dialog?.close();
      requestAnimationFrame(() => $('#name')?.focus({ preventScroll: true }));
    });
    $$('.select-package').forEach((link) => {
      link.addEventListener('click', () => {
        if (interest) interest.value = link.dataset.package;
      });
    });

    // Download a local inquiry draft instead of sending customer data anywhere.
    const inquiry = $('#inquiry');
    const message = $('#message');

    // Formatting HTML can leave whitespace inside an empty textarea.
    if (message && !message.value.trim()) message.value = '';

    inquiry?.addEventListener('submit', (event) => {
      event.preventDefault();
      const requiredText = [...inquiry.querySelectorAll('input[required], textarea[required]')];
      requiredText.forEach((field) => {
        field.value = field.value.trim();
      });

      if (!inquiry.reportValidity()) return;

      const fields = new FormData(inquiry);
      const text = [
        'C&T PRODUCTIONS — WEBSITE PROJECT INQUIRY',
        '',
        `Name: ${fields.get('name')}`,
        `Email: ${fields.get('email')}`,
        `Business: ${fields.get('business')}`,
        `Package: ${fields.get('package')}`,
        '',
        'Project details:',
        String(fields.get('message')),
        '',
        'This is a local draft. It has not been sent.'
      ].join('\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.href = url;
      download.download = 'ct-productions-inquiry.txt';
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      const result = $('.form-result');
      if (result) {
        result.hidden = false;
        result.textContent = 'Your inquiry draft is ready. If your browser allows downloads, it will appear in your downloads folder. Nothing has been sent.';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
/* C&T — Interactive liquid-glass hero */
(() => {
  "use strict";

  function initializeLiquidHero() {
    const hero = document.querySelector(".liquid-hero");

    if (!hero || hero.dataset.liquidInitialized) return;

    hero.dataset.liquidInitialized = "true";

    const canvas = hero.querySelector(".liquid-canvas");
    const context = canvas?.getContext("2d");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let width = 0;
    let height = 0;
    let frameId = null;
    let previousTime = 0;
    let waterTime = 0;
    let visible = true;

    const target = {
      x: 0,
      y: 0,
      scroll: 0
    };

    const current = {
      x: 0,
      y: 0,
      scroll: 0
    };

    function motionDisabled() {
      return (
        reducedMotion.matches ||
        document.body.classList.contains("no-motion")
      );
    }

    function canAnimate() {
      return (
        visible &&
        !document.hidden &&
        !motionDisabled()
      );
    }

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    function updateScroll() {
      const bounds = hero.getBoundingClientRect();

      target.scroll = clamp(
        -bounds.top / Math.max(bounds.height, 1),
        0,
        1
      );
    }

    function resizeCanvas() {
      width = hero.clientWidth;
      height = hero.clientHeight;

      if (canvas && context) {
        // Limit resolution to keep the effect light on phones.
        const pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          1.5
        );

        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);

        context.setTransform(
          pixelRatio,
          0,
          0,
          pixelRatio,
          0,
          0
        );
      }

      updateScroll();

      if (!motionDisabled()) {
        drawWater();
      }
    }

    function drawWater() {
      if (!context || width <= 0 || height <= 0) return;

      context.clearRect(0, 0, width, height);

      const centerX = width * 0.5 + current.x * 24;
      const centerY =
        height * 0.36 +
        current.y * 18 -
        current.scroll * 65;

      const baseRadius = Math.max(width * 0.3, 180);
      const ringCount = width < 600 ? 10 : 15;
      const segments = 100;

      context.save();
      context.translate(centerX, centerY);
      context.rotate(-0.22);
      context.lineJoin = "round";

      // Irregular elliptical contours resemble reflected
      // light traveling across a shallow water surface.
      for (let ring = 0; ring < ringCount; ring += 1) {
        const radius = baseRadius * (0.45 + ring * 0.13);
        const phase = waterTime * 0.5 - ring * 0.42;

        context.beginPath();

        for (let point = 0; point <= segments; point += 1) {
          const angle = (point / segments) * Math.PI * 2;

          const distortion =
            Math.sin(angle * 3 + phase) * 0.045 +
            Math.cos(angle * 5 - phase * 0.7) * 0.025 +
            Math.sin(angle * 2 + waterTime * 0.3) * 0.035;

          const rippleRadius = radius * (1 + distortion);

          const x = Math.cos(angle) * rippleRadius;
          const y =
            Math.sin(angle) * rippleRadius * 0.55 +
            Math.sin(angle * 2 + phase) * 12;

          if (point === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.closePath();

        // Broad, soft edge underneath a narrow highlight.
        context.strokeStyle = "rgba(77, 111, 131, 0.045)";
        context.lineWidth = 9;
        context.stroke();

        const brightness =
          0.18 +
          (Math.sin(phase + ring * 0.2) + 1) * 0.14;

        context.strokeStyle =
          `rgba(255, 255, 255, ${brightness})`;
        context.lineWidth = ring % 3 === 0 ? 2 : 1;
        context.stroke();
      }

      context.restore();

      // A soft reflection follows the pointer.
      const lightX = width * (0.5 + current.x * 0.18);
      const lightY = height * (0.35 + current.y * 0.12);
      const lightRadius = Math.max(width * 0.32, 160);

      const reflection = context.createRadialGradient(
        lightX,
        lightY,
        0,
        lightX,
        lightY,
        lightRadius
      );

      reflection.addColorStop(0, "rgba(255,255,255,0.24)");
      reflection.addColorStop(0.45, "rgba(255,255,255,0.08)");
      reflection.addColorStop(1, "rgba(255,255,255,0)");

      context.fillStyle = reflection;
      context.fillRect(0, 0, width, height);
    }

    function updateLogo() {
      const bob = Math.sin(waterTime * 0.8) * 4;

      // The logo and glass move at different speeds
      // to create a subtle sense of depth.
      hero.style.setProperty(
        "--logo-x",
        `${(current.x * 13).toFixed(2)}px`
      );

      hero.style.setProperty(
        "--logo-y",
        `${(
          current.y * 9 +
          current.scroll * 42 +
          bob
        ).toFixed(2)}px`
      );

      hero.style.setProperty(
        "--logo-rotate-x",
        `${(-current.y * 5 - current.scroll * 5).toFixed(2)}deg`
      );

      hero.style.setProperty(
        "--logo-rotate-y",
        `${(current.x * 7).toFixed(2)}deg`
      );

      hero.style.setProperty(
        "--glass-x",
        `${(-current.x * 10).toFixed(2)}px`
      );

      hero.style.setProperty(
        "--glass-y",
        `${(
          -current.y * 7 -
          current.scroll * 24 -
          bob * 0.5
        ).toFixed(2)}px`
      );

      hero.style.setProperty(
        "--shine-x",
        `${(50 + current.x * 22).toFixed(2)}%`
      );

      hero.style.setProperty(
        "--shine-y",
        `${(35 + current.y * 18).toFixed(2)}%`
      );
    }

    function animate(timestamp) {
      frameId = null;

      if (!canAnimate()) return;

      const elapsed = previousTime
        ? timestamp - previousTime
        : 1000 / 30;

      // Render at approximately 30 FPS.
      if (elapsed < 1000 / 30) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      previousTime = timestamp;

      const delta = Math.min(elapsed / 1000, 0.06);
      const easing = 1 - Math.exp(-delta * 5);

      waterTime += delta;

      current.x += (target.x - current.x) * easing;
      current.y += (target.y - current.y) * easing;
      current.scroll +=
        (target.scroll - current.scroll) * easing;

      updateLogo();
      drawWater();

      frameId = requestAnimationFrame(animate);
    }

    function synchronizeAnimation() {
      if (!canAnimate()) {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }

        previousTime = 0;
        return;
      }

      if (frameId === null) {
        previousTime = 0;
        frameId = requestAnimationFrame(animate);
      }
    }

    hero.addEventListener(
      "pointermove",
      (event) => {
        // Let touch gestures scroll the page normally.
        if (event.pointerType === "touch" || motionDisabled()) {
          return;
        }

        const bounds = hero.getBoundingClientRect();

        target.x = clamp(
          ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
          -1,
          1
        );

        target.y = clamp(
          ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
          -1,
          1
        );
      },
      { passive: true }
    );

    function resetPointer() {
      target.x = 0;
      target.y = 0;
    }

    hero.addEventListener("pointerleave", resetPointer);
    hero.addEventListener("pointercancel", resetPointer);

    window.addEventListener("scroll", updateScroll, {
      passive: true
    });

    // Stop rendering when the hero is off screen.
    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          updateScroll();
          synchronizeAnimation();
        },
        { threshold: 0 }
      );

      visibilityObserver.observe(hero);
    }

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(hero);
    } else {
      window.addEventListener("resize", resizeCanvas, {
        passive: true
      });
    }

    // Connect to the existing Pause motion button,
    // which adds or removes the body's no-motion class.
    const motionObserver = new MutationObserver(
      synchronizeAnimation
    );

    motionObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });

    reducedMotion.addEventListener(
      "change",
      synchronizeAnimation
    );

    document.addEventListener(
      "visibilitychange",
      synchronizeAnimation
    );

    resizeCanvas();
    synchronizeAnimation();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeLiquidHero,
      { once: true }
    );
  } else {
    initializeLiquidHero();
  }
})();