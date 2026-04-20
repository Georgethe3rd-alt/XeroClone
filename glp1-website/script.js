// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.glp1-card, .step, .med-card, .testimonial, .faq-item, .result-stat').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// CTA Form submission
const ctaForm = document.getElementById('ctaForm');
const formSuccess = document.getElementById('formSuccess');
ctaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(ctaForm);
  const fields = ['firstName', 'lastName', 'email', 'goal', 'bmi'];
  let valid = true;
  fields.forEach(f => {
    if (!data.get(f)) valid = false;
  });
  if (!valid) {
    alert('Please fill in all fields before submitting.');
    return;
  }
  ctaForm.style.display = 'none';
  formSuccess.style.display = 'block';
});

// Smooth anchor scroll with offset for fixed nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// Animate stat numbers on scroll
function animateNumber(el, target, suffix = '') {
  let start = 0;
  const duration = 1500;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const val = Math.floor(progress * target);
    el.textContent = val + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num');
      nums.forEach(n => {
        const raw = n.textContent;
        if (raw.includes('%')) animateNumber(n, parseInt(raw), '%');
        else if (raw.includes('K')) {
          let count = 0;
          const target = parseInt(raw);
          const step = timestamp => {
            if (!count) count = timestamp;
            const p = Math.min((timestamp - count) / 1500, 1);
            n.textContent = Math.floor(p * target) + 'K+';
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);
