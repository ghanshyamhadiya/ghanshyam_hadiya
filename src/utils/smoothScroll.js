// Small bridge so any component can drive the Lenis instance created in App.jsx
// without prop drilling or a context provider.

let lenisInstance = null;

export const registerLenis = (instance) => {
    lenisInstance = instance;
};

export const scrollToSection = (id, options = {}) => {
    const target = typeof id === 'string' && id.startsWith('#') ? id : `#${id}`;
    const element = document.querySelector(target);
    if (!element) return;

    if (lenisInstance) {
        lenisInstance.scrollTo(element, { offset: 0, duration: 1.4, ...options });
    } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
