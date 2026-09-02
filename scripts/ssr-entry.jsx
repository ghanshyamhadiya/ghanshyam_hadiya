// SSR smoke-test entry. Rendering the whole tree to a string catches missing
// data exports, undefined property access and hook-order problems that a
// type-less codebase would otherwise only surface in the browser.
import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';

export function render() {
    return renderToString(<App />);
}
