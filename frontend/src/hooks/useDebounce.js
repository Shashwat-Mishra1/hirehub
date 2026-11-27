import { useEffect, useState } from 'react';

// returns `value`, but only after it has stopped changing for `delay` ms
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);          // cleanup: cancel the timer if value changes again
  }, [value, delay]);

  return debounced;
}