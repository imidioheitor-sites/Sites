# DecayCard

Integrate the <DecayCard /> component from React Bits
You are helping integrate an open-source React component into an existing application.
Component: DecayCard
Variant: JavaScript + CSS
Dependencies: gsap
Usage Example
import DecayCard from './DecayCard';
<DecayCard width={200} height={300} image="https://picsum.photos/300/400?grayscale">
  <h2>Decay<br/>Card</h2>
</DecayCard>


Props
Prop Type Default Description children ReactNode — The content (JSX) to be rendered inside the card. width number 300 The width of the card in pixels. height number 400 The height of the card in pixels. image string — Allows setting the background image of the card. baseFrequency number 0.015 Base frequency for the turbulence filter. Lower values create larger, smoother patterns. numOctaves number 5 Number of octaves for the turbulence filter. Higher values add finer detail. seed number 4 Seed value for the turbulence random number generator. maxDisplacement number 400 Maximum displacement scale applied when the cursor moves. Controls the intensity of the decay effect. movementBound number 50 Maximum pixel distance the card can translate from its origin when following the cursor.
Full Component Source
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './DecayCard.css';
const DecayCard = ({
  width = 300,
  height = 400,
  image = 'https://picsum.photos/300/400?grayscale',
  baseFrequency = 0.015,
  numOctaves = 5,
  seed = 4,
  maxDisplacement = 400,
  movementBound = 50,
  children
}) => {
  const svgRef = useRef(null);
  const displacementMapRef = useRef(null);
  const cursor = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cachedCursor = useRef({ ...cursor.current });
  const winsize = useRef({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;
    const distance = (x1, x2, y1, y2) => {
      const a = x1 - x2;
      const b = y1 - y2;
      return Math.hypot(a, b);
    };
    const handleResize = () => {
      winsize.current = { width: window.innerWidth, height: window.innerHeight };
    };
    const handleMouseMove = ev => {
      cursor.current = { x: ev.clientX, y: ev.clientY };
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    const imgValues = {
      imgTransforms: { x: 0, y: 0, rz: 0 },
      displacementScale: 0
    };
    const render = () => {
      let targetX = lerp(imgValues.imgTransforms.x, map(cursor.current.x, 0, winsize.current.width, -120, 120), 0.1);
      let targetY = lerp(imgValues.imgTransforms.y, map(cursor.current.y, 0, winsize.current.height, -120, 120), 0.1);
      let targetRz = lerp(imgValues.imgTransforms.rz, map(cursor.current.x, 0, winsize.current.width, -10, 10), 0.1);
      if (targetX > movementBound) targetX = movementBound + (targetX - movementBound) * 0.2;
      if (targetX < -movementBound) targetX = -movementBound + (targetX + movementBound) * 0.2;
      if (targetY > movementBound) targetY = movementBound + (targetY - movementBound) * 0.2;
      if (targetY < -movementBound) targetY = -movementBound + (targetY + movementBound) * 0.2;
      imgValues.imgTransforms.x = targetX;
      imgValues.imgTransforms.y = targetY;
      imgValues.imgTransforms.rz = targetRz;
      if (svgRef.current) {
        gsap.set(svgRef.current, {
          x: imgValues.imgTransforms.x,
          y: imgValues.imgTransforms.y,
          rotateZ: imgValues.imgTransforms.rz
        });
      }
      const cursorTravelledDistance = distance(
        cachedCursor.current.x,
        cursor.current.x,
        cachedCursor.current.y,
        cursor.current.y
      );
      imgValues.displacementScale = lerp(
        imgValues.displacementScale,
        map(cursorTravelledDistance, 0, 200, 0, maxDisplacement),
        0.06
      );
      if (displacementMapRef.current) {
        gsap.set(displacementMapRef.current, { attr: { scale: imgValues.displacementScale } });
      }
      cachedCursor.current = { ...cursor.current };
      rafId = requestAnimationFrame(render);
    };
    let rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [maxDisplacement, movementBound]);
  return (
    <div className="content" style={{ width: `${width}px`, height: `${height}px` }} ref={svgRef}>
      <svg viewBox="-60 -75 720 900" preserveAspectRatio="xMidYMid slice" className="svg">
        <filter id="imgFilter">
          <feTurbulence
            type="turbulence"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            seed={seed}
            stitchTiles="stitch"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="turbulence1"
          />
          <feDisplacementMap
            ref={displacementMapRef}
            in="SourceGraphic"
            in2="turbulence1"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="B"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="displacementMap3"
          />
        </filter>
        <g>
          <image
            href={image}
            x="0"
            y="0"
            width="600"
            height="750"
            filter="url(#imgFilter)"
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      </svg>
      <div className="card-text">{children}</div>
    </div>
  );
};
export default DecayCard;


Component CSS
.content {
  position: relative;
}
.svg {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  will-change: transform;
}
.card-text {
  position: absolute;
  bottom: 1.2em;
  letter-spacing: -0.5px;
  font-weight: 900;
  left: 1em;
  font-size: 2.5rem;
  line-height: 1.5em;
}
.card-text::first-line {
  font-size: 4rem;
}


Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
3. Import the CSS file alongside the component.
4. Import and render the component using the usage example above as a starting point.
5. Adjust props as needed for the specific use case — refer to the props table for all available options.
Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
3. Import the CSS file alongside the component.
4. Import and render the component using the usage example above as a starting point.
5. Adjust props as needed for the specific use case — refer to the props table for all available options.
Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
3. Import the CSS file alongside the component.
4. Import and render the component using the usage example above as a starting point.
5. Adjust props as needed for the specific use case — refer to the props table for all available options.
Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
3. Import the CSS file alongside the component.
4. Import and render the component using the usage example above as a starting point.
5. Adjust props as needed for the specific use case — refer to the props table for all available options.
