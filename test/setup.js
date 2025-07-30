// Test setup file for Vitest
// This file is run before each test file

// Mock DOM elements that might be needed
global.document = global.document || {
	createElement: (tag) => ({
		textContent: '',
		innerHTML: '',
		addEventListener: () => { },
		removeEventListener: () => { }
	}),
	getElementById: () => null
};
