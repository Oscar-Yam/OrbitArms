import React, { useState, useEffect } from "react";

interface NumericInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: React.CSSProperties;
}

const NumericInput: React.FC<NumericInputProps> = ({ value, onChange, min, max, step, style }) => {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <input
      type="number"
      value={text}
      step={step}
      style={style}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        let n = parseFloat(text);
        if (isNaN(n)) n = value;
        if (min !== undefined) n = Math.max(min, n);
        if (max !== undefined) n = Math.min(max, n);
        onChange(n);
        setText(String(n));
      }}
    />
  );
};

export default NumericInput;
