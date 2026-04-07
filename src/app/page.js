"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "50px", fontFamily: "system-ui" }}>
      <h1>🧪 NeoCrew QA Tool</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}
