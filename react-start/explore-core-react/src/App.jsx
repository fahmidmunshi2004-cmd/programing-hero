import { useEffect, useState } from "react";
import "./App.css";
import Bowler from "./bowler";

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return [pathname, setPathname];
}

function navigate(to, setPathname) {
  window.history.pushState({}, "", to);
  setPathname(window.location.pathname);
}

function HomePage({ onEnter }) {
  return (
    <main className="home-page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Cricket Studio</span>
          <h1>Scoreboard with teams, overs, wickets, and winners.</h1>
          <p>
            Set two teams, customize players, choose overs, and play a full match.
            The scoreboard moves from first innings to second innings automatically
            and shows a clear final result.
          </p>

          <div className="hero-actions">
            <button className="primary-btn" onClick={onEnter}>
              Open Scoreboard
            </button>
            <a className="ghost-btn" href="/scoreboard">
              Go to Route
            </a>
          </div>

          <div className="feature-row">
            <article className="feature-card">
              <strong>2 innings</strong>
              <span>Team 1 bats first, Team 2 chases the target.</span>
            </article>
            <article className="feature-card">
              <strong>Custom overs</strong>
              <span>Choose how many overs each innings gets.</span>
            </article>
            <article className="feature-card">
              <strong>Player stats</strong>
              <span>Runs, balls, fours, sixes, and dismissals stay separate.</span>
            </article>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-top">
            <span className="live-pill">Live Preview</span>
            <span className="live-pill muted">Clean UI</span>
          </div>
          <div className="panel-score">
            <span>First innings</span>
            <strong>148/6</strong>
          </div>
          <div className="panel-grid">
            <div>
              <label>Overs</label>
              <strong>20.0</strong>
            </div>
            <div>
              <label>Target</label>
              <strong>149</strong>
            </div>
            <div>
              <label>Run Rate</label>
              <strong>7.40</strong>
            </div>
            <div>
              <label>Status</label>
              <strong>Second innings</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreboardPage() {
  return (
    <main className="scoreboard-page">
      <Bowler />
    </main>
  );
}

function App() {
  const [pathname, setPathname] = usePathname();

  useEffect(() => {
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      const link =
        target instanceof Element ? target.closest("a[data-route]") : null;
      if (!link) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("http")) {
        return;
      }

      event.preventDefault();
      navigate(href, setPathname);
    };

    document.addEventListener("click", onKey);
    return () => document.removeEventListener("click", onKey);
  }, [setPathname]);

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">PH</span>
          <div>
            <strong>Programming Hero Cricket</strong>
            <p>Scoreboard app</p>
          </div>
        </div>

        <nav className="site-nav">
          <a data-route="true" href="/" className={pathname === "/" ? "nav-link active" : "nav-link"}>
            Home
          </a>
          <a
            data-route="true"
            href="/scoreboard"
            className={pathname === "/scoreboard" ? "nav-link active" : "nav-link"}
          >
            Scoreboard
          </a>
        </nav>
      </header>

      {pathname === "/scoreboard" ? (
        <ScoreboardPage />
      ) : (
        <HomePage onEnter={() => navigate("/scoreboard", setPathname)} />
      )}
    </>
  );
}

export default App;
