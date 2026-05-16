import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';

describe('Example Hook Test', () => {
  it('should handle state correctly', () => {
    const { result } = renderHook(() => useState(0));

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => {
      const [count, setCount] = useState(0);
      const increment = () => setCount((c) => c + 1);
      return { count, increment };
    });

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
