import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Redirect from an effect, never from render.
 *
 * Several screens can be reached in a state they can't render — a deep link
 * into /game/vote with no round, or a cold start after the store was cleared.
 * Calling router.replace() straight from the render body is a side effect
 * during render: React may run it twice, it fires before the tree commits, and
 * under concurrent rendering it can navigate from a render that gets thrown
 * away. This defers it by one tick and lets the screen return null in the
 * meantime.
 */
export function useRedirectWhen(condition: boolean, href: string) {
  useEffect(() => {
    if (condition) router.replace(href as never);
  }, [condition, href]);
}
