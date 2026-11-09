import * as React from 'react';
import { flushSync } from 'react-dom';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function App() {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState('Ready');
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrors((previous) => [...previous, event.message]);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  async function reproduce() {
    setErrors([]);
    flushSync(() => setOpen(true));
    setStatus('Opening drawer');
    await delay(350);

    const handle = document.getElementById('swipe-handle')!;
    function touch(type: string, clientY: number) {
      const target = type === 'touchend' ? document.body : handle;
      const point = new Touch({
        identifier: 0,
        target,
        clientX: 100,
        pageX: 100,
        clientY,
        pageY: clientY,
      });
      target.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches: type === 'touchend' ? [] : [point],
          changedTouches: [point],
        }),
      );
    }

    setStatus('Starting a swipe with synthetic touch events');
    touch('touchstart', window.innerHeight - 180);
    touch('touchmove', window.innerHeight - 160);
    await delay(20);
    touch('touchmove', window.innerHeight - 20);
    flushSync(() => setOpen(false));
    setStatus('Closed programmatically; waiting for the paper to unmount');
    await delay(350);
    if (document.getElementById('swipe-handle')) {
      setStatus('Unexpected: the drawer paper is still mounted');
      return;
    }
    touch('touchend', window.innerHeight);
    setStatus('Late touchend dispatched after paper unmounted');
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>SwipeableDrawer: close during a swipe</h1>
      <p>MUI 9.5.0, bottom drawer, ModalProps.keepMounted=false, default transition duration.</p>
      <button type="button" onClick={reproduce}>
        Reproduce late touchend
      </button>{' '}
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer manually
      </button>
      <p role="status">{status}</p>
      <pre data-testid="errors">{errors.length ? errors.join('\n') : 'No errors'}</pre>
      <p>
        The automatic reproduction uses synthetic touch events. For a manual check on a touch
        device, open the drawer, press its delayed-close button, then drag the handle down and keep
        your finger down until the drawer closes. Release after the exit transition.
      </p>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: false }}
      >
        <div id="swipe-handle" style={{ height: 80, background: '#ddd', padding: 16 }}>
          Drag down here
        </div>
        <div style={{ padding: 24 }}>
          <label>
            Draft <input aria-label="Draft" />
          </label>{' '}
          <button type="button" onClick={() => setTimeout(() => setOpen(false), 1000)}>
            Close after 1 second
          </button>
        </div>
      </SwipeableDrawer>
    </main>
  );
}
