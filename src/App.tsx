import React, { useEffect, useState } from 'react';
import { homeBody, footerBody } from './home';
import { pages } from './pages';
import { runDemo, initPage } from './demoRun';
import logoUrl from './assets/logo.png';
import './style.css';

const links: [string, string][] = [['about', 'About'], ['services', 'Services'], ['industries', 'Industries'], ['resources', 'Resources'], ['faq', 'FAQ'], ['contact', 'Contact']];
const route = () => { const m = location.hash.match(/^#\/([\w-]+)/); return m && pages[m[1]] ? m[1] : 'home'; };

export function App() {
    const [r, setR] = useState(route());
    useEffect(() => { runDemo(); const f = () => { setR(route()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
    useEffect(() => { (window as any).__snaxPaused = r !== 'home'; setTimeout(initPage, 0); }, [r]);
    const submit = (e: any) => {
        const t = e.target;
        if (!t || !t.closest) return;
        const f = t.closest('.demo-form');
        if (!f || (e.type === 'click' && !t.closest('.demosend'))) return;
        e.preventDefault();
        const need = f.querySelector('[required]:invalid, textarea[required]:placeholder-shown');
        const miss = Array.from(f.querySelectorAll('[required]')).find((x: any) => !String(x.value || '').trim());
        if (miss) { (miss as any).focus(); return; }
        f.innerHTML = '<h3>Thanks! This is a demo form.</h3><p style="line-height:1.5;color:#5a534b">Nothing was sent. This is an unofficial design demo.</p>';
    };
    return (
        <div className="demo-root" onSubmit={submit} onClick={submit}>
            <nav className="nav">
                <a className="lg" href="#/"><img src={logoUrl} alt="" />SnaxSmart</a>
                <div className="nl">{links.map(([k, t]) => <a key={k} href={'#/' + k} className={r === k ? 'on' : ''}>{t}</a>)}</div>
                <span className="btn sm">Call +91 98807 98807</span>
            </nav>
            <div style={{ display: r === 'home' ? 'block' : 'none' }} dangerouslySetInnerHTML={{ __html: homeBody }} />
            {r !== 'home' && <div className="pg" key={r} dangerouslySetInnerHTML={{ __html: pages[r] }} />}
            <div dangerouslySetInnerHTML={{ __html: footerBody }} />
        </div>
    );
}
