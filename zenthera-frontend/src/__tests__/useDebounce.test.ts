import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should update the value after the specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial before timer runs
    expect(result.current).toBe('initial');

    // Fast-forward time by 499ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Fast-forward time by 1ms (total 500ms)
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should clear the timeout if value changes before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update to 'updated 1'
    rerender({ value: 'updated 1', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Still initial
    expect(result.current).toBe('initial');

    // Update to 'updated 2' before first timer finishes
    rerender({ value: 'updated 2', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300); // Total time since first update is 600ms, but timer was reset
    });

    // Still initial because the second timer hasn't reached 500ms
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200); // Total 500ms for second timer
    });

    // Now it should be updated to the second value
    expect(result.current).toBe('updated 2');
  });
});
