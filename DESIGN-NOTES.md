# Portfolio polish

The site retains its pale gray, charcoal, amber, glass surfaces, and orbital sculpture. The refinement introduces a clearer editorial hierarchy across the hero, capabilities, projects, approach, process, experience, contact, and linked scroll world.

- NoiGate is the featured project, followed by three supporting project cards.
- Small screens have a collapsible, keyboard-accessible navigation menu.
- The contact section explains the invitation and explicitly labels its action as composing an email. It continues to use the visitor's mail app.
- Desktop sculpture orientation responds gently to the pointer. Existing ring formations and geometry remain intact.
- On phones and tablets, the animated sculpture stays in the hero; rendering pauses outside its visible area.
- Reduced motion renders a single frame using the existing still image, without downloading the decorative core video.
- WebGL failure retains the SVG fallback, and the portfolio remains readable without JavaScript.
- The scroll world shares the portfolio's typography and keeps invisible scene controls out of keyboard navigation.

Implementation: `polish.css` contains the visual refinements, `polish.js` the navigation enhancement, and `engine.js` the graphics changes. No build step is needed; run `npm start` and open http://localhost:3000.

Browser review artifacts are kept locally in `output/playwright/` and excluded from version control. Checks cover desktop, 390px and 320px phone layouts, form validation, menu interaction, reduced motion, WebGL fallback, JavaScript-disabled rendering, and the linked world.
