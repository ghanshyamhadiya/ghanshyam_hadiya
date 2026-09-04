import { useSyncExternalStore } from 'react';
import {
    getBooted,
    getBootedServerSnapshot,
    subscribeBooted,
} from '../utils/bootState';

// True once the intro curtain has started lifting. Entry animations gate on
// this so they play in front of the user rather than behind the preloader.
export function useBooted() {
    return useSyncExternalStore(subscribeBooted, getBooted, getBootedServerSnapshot);
}

export default useBooted;
