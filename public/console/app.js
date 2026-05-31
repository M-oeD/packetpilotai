// App bootstrap for PacketPilot Console
// Requires: React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor
//           GridBg, ScanLine, StatusBar, NavBar, Home, Blog, FooterBar, CopilotDock

const { useState, useEffect } = React;

function applyTweaks(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.theme || "dark");
  root.setAttribute("data-density", t.density || "cozy");
  if (t.accent) root.style.setProperty("--ppc-accent", t.accent);
  if (t.accent) {
    const r = parseInt(t.accent.slice(1, 3), 16);
    const g = parseInt(t.accent.slice(3, 5), 16);
    const b = parseInt(t.accent.slice(5, 7), 16);
    root.style.setProperty(
      "--ppc-accent-soft",
      `rgba(${r}, ${g}, ${b}, 0.14)`,
    );
  }
}

function App() {
  const [route, setRoute] = useState(
    window.location.hash.replace("#", "") === "blog" ? "blog" : "home",
  );
  const [tweaks, setTweak] = useTweaks(window.PPC_TWEAK_DEFAULTS);

  useEffect(() => {
    applyTweaks(tweaks);
  }, [tweaks]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "blog") setRoute("blog");
      else if (h === "home" || h === "") setRoute("home");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goBlog = () => {
    window.location.hash = "blog";
    setRoute("blog");
    window.scrollTo({ top: 0 });
  };
  const goHome = () => {
    window.location.hash = "home";
    setRoute("home");
    window.scrollTo({ top: 0 });
  };
  const onNav = (id) => {
    if (id === "home") goHome();
    else if (id === "blog") goBlog();
  };
  const onOpenPost = () => {
    // Posts are stubbed — stay on blog page
  };

  return (
    <>
      <GridBg />
      <ScanLine />
      <StatusBar />
      <NavBar active={route} onNav={onNav} />
      <div className="ppc-shell">
        {route === "home" ? (
          <Home onGoBlog={goBlog} />
        ) : (
          <Blog onOpen={onOpenPost} />
        )}
      </div>
      <FooterBar />
      <CopilotDock />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakRadio
            label="Color scheme"
            value={tweaks.theme}
            options={[
              { label: "Dark", value: "dark" },
              { label: "Midnight", value: "midnight" },
              { label: "Amber CRT", value: "amber" },
            ]}
            onChange={(v) => setTweak("theme", v)}
          />
          <TweakColor
            label="Accent"
            value={tweaks.accent || "#39d0d8"}
            onChange={(v) => setTweak("accent", v)}
          />
        </TweakSection>
        <TweakSection title="Density">
          <TweakRadio
            label="Spacing"
            value={tweaks.density}
            options={[
              { label: "Compact", value: "compact" },
              { label: "Cozy", value: "cozy" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
