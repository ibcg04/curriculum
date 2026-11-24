document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const navbar = document.querySelector('.navbar');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelectorAll('.nav-links a');
    const progress = document.querySelector('.scroll-progress');
    const toTop = document.querySelector('.to-top');

    document.getElementById('year').textContent = new Date().getFullYear();

    /* ---------- Navbar: sombra + barra de progreso ---------- */
    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 20);
        toTop.classList.toggle('show', y > 600);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Menú móvil ---------- */
    const closeMenu = () => {
        navbar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
        const open = navbar.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    links.forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', e => { if (!navbar.contains(e.target)) closeMenu(); });

    /* ---------- Scrollspy ---------- */
    const sections = [...links].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    /* ---------- Animaciones de aparición + contadores ---------- */
    const reveal = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            entry.target.querySelectorAll('[data-count]').forEach(countUp);
            reveal.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

    function countUp(el) {
        if (el.dataset.done) return;
        el.dataset.done = '1';
        const target = +el.dataset.count, suffix = el.dataset.suffix || '';
        const start = performance.now(), dur = 1200;
        const step = now => {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /* ---------- Tema claro / oscuro ---------- */
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const applyTheme = t => {
        root.setAttribute('data-theme', t);
        themeMeta.setAttribute('content', t === 'light' ? '#f8fafc' : '#0b1226');
    };
    applyTheme(root.getAttribute('data-theme'));
    document.querySelector('.theme-btn').addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });

    /* ---------- Idioma ES / EN ---------- */
    const i18nEls = document.querySelectorAll('[data-en]');
    i18nEls.forEach(el => { el.dataset.es = el.innerHTML.trim(); });
    const langBtn = document.querySelector('.lang-btn');
    const typed = document.querySelector('.typed');
    let lang = localStorage.getItem('lang') || 'es';

    const applyLang = l => {
        lang = l;
        root.lang = l;
        i18nEls.forEach(el => { el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.es; });
        langBtn.textContent = l === 'en' ? 'ES' : 'EN';
        document.title = l === 'en' ? 'Iván Cedeño | Résumé' : 'Iván Cedeño | Currículum';
        if (typed) typed.dataset.active = l === 'en' ? typed.dataset.wordsEn : typed.dataset.words;
        updateRefsBtn();
    };
    langBtn.addEventListener('click', () => {
        const next = lang === 'es' ? 'en' : 'es';
        applyLang(next);
        localStorage.setItem('lang', next);
    });

    /* ---------- Referencias: mostrar/ocultar contactos ---------- */
    const refs = document.getElementById('referencias');
    const refsBtn = document.querySelector('.refs-toggle');
    function updateRefsBtn() {
        const shown = refs.classList.contains('show-contacts');
        refsBtn.setAttribute('aria-expanded', String(shown));
        refsBtn.textContent = shown
            ? (lang === 'en' ? 'Hide contact details' : 'Ocultar datos de contacto')
            : (lang === 'en' ? 'Show contact details' : 'Mostrar datos de contacto');
    }
    refsBtn.addEventListener('click', () => {
        refs.classList.toggle('show-contacts');
        updateRefsBtn();
    });

    /* ---------- Texto que se escribe solo ---------- */
    if (typed) {
        typed.dataset.active = typed.dataset.words;
        let w = 0, i = 0, deleting = false;
        const tick = () => {
            const words = typed.dataset.active.split('|');
            const word = words[w % words.length];
            if (i > word.length) i = word.length;
            typed.textContent = word.slice(0, i);
            if (!deleting && i < word.length) i++;
            else if (deleting && i > 0) i--;
            else if (!deleting) { deleting = true; return setTimeout(tick, 1600); }
            else { deleting = false; w = (w + 1) % words.length; }
            setTimeout(tick, deleting ? 40 : 80);
        };
        tick();
    }

    applyLang(lang);

    /* ---------- Descargar CV (imprimir como PDF) ---------- */
    document.querySelector('.print-btn').addEventListener('click', () => {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        window.print();
    });

    /* ---------- Formulario (Formspree con respaldo mailto) ---------- */
    const form = document.getElementById('contact-form');
    const status = form.querySelector('.form-status');
    const msg = {
        es: { sending: 'Enviando…', ok: '¡Gracias! Tu mensaje fue enviado.', err: 'No se pudo enviar. Escríbeme a ivancede@espol.edu.ec', invalid: 'Completa todos los campos con un correo válido.' },
        en: { sending: 'Sending…', ok: 'Thanks! Your message was sent.', err: 'Could not send. Email me at ivancede@espol.edu.ec', invalid: 'Please fill in all fields with a valid email.' }
    };
    form.addEventListener('submit', async e => {
        if (!form.checkValidity()) {
            e.preventDefault();
            form.classList.add('touched');
            status.textContent = msg[lang].invalid;
            status.className = 'form-status error';
            return;
        }
        const id = form.dataset.formspree;
        if (!id) return; // sin Formspree: deja que actúe el mailto
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        status.textContent = msg[lang].sending;
        status.className = 'form-status';
        try {
            const res = await fetch(`https://formspree.io/f/${id}`, {
                method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
            });
            if (!res.ok) throw new Error();
            form.reset();
            form.classList.remove('touched');
            status.textContent = msg[lang].ok;
            status.className = 'form-status success';
        } catch {
            status.textContent = msg[lang].err;
            status.className = 'form-status error';
        } finally {
            btn.disabled = false;
        }
    });
});
