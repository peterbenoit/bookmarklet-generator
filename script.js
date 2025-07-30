// Bookmarklet Generator Application
// Main application initialization and component management

class BookmarkletApp {
	constructor() {
		this.codeEditor = null;
		this.nameInput = null;
		this.outputDisplay = null;
		this.validationEngine = null;
		this.bookmarkletGenerator = null;

		this.init();
	}

	init() {
		// Wait for DOM to be ready
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
		} else {
			this.initializeComponents();
		}
	}

	initializeComponents() {
		// Initialize core components
		this.validationEngine = new ValidationEngine();
		this.bookmarkletGenerator = new BookmarkletGenerator();

		// Initialize UI components
		this.codeEditor = new CodeEditor('code-editor');
		this.nameInput = new NameInput('bookmarklet-name');
		this.outputDisplay = new OutputDisplay('bookmarklet-output');

		// Set up event handlers
		this.setupEventHandlers();

		console.log('Bookmarklet Generator initialized');
	}

	setupEventHandlers() {
		// Code editor change handler with debouncing
		let debounceTimer;
		this.codeEditor.onCodeChange((code) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.handleCodeChange(code);
			}, 300);
		});

		// Name input change handler
		this.nameInput.onNameChange((name) => {
			this.handleNameChange(name);
		});
	}

	handleCodeChange(code) {
		// Validate code and update display
		const validation = this.validationEngine.validateSyntax(code);

		if (validation.isValid && code.trim()) {
			this.generateBookmarklet(code);
		} else if (validation.errors.length > 0) {
			this.displayErrors(validation.errors);
		} else {
			this.showPlaceholder();
		}
	}

	handleNameChange(name) {
		// Update bookmarklet display with new name
		const code = this.codeEditor.getValue();
		if (code.trim()) {
			this.generateBookmarklet(code);
		}
	}

	generateBookmarklet(code) {
		const name = this.nameInput.getValue() || 'Custom Bookmarklet';
		const bookmarklet = this.bookmarkletGenerator.generate(code, name);

		this.outputDisplay.updateBookmarklet(bookmarklet);
		this.clearErrors();
	}

	displayErrors(errors) {
		const errorDisplay = document.getElementById('error-display');
		const formattedErrors = this.validationEngine.formatErrors(errors);

		errorDisplay.innerHTML = formattedErrors;
		errorDisplay.classList.remove('hidden');

		this.outputDisplay.showError('Fix syntax errors to generate bookmarklet');
	}

	clearErrors() {
		const errorDisplay = document.getElementById('error-display');
		errorDisplay.classList.add('hidden');
		this.outputDisplay.clearError();
	}

	showPlaceholder() {
		this.outputDisplay.showPlaceholder();
		this.clearErrors();
	}
}

// Placeholder classes for components (to be implemented in later tasks)
class CodeEditor {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.changeCallback = null;
	}

	getValue() {
		return this.element.value;
	}

	setValue(code) {
		this.element.value = code;
	}

	onCodeChange(callback) {
		this.changeCallback = callback;
		this.element.addEventListener('input', (e) => {
			if (this.changeCallback) {
				this.changeCallback(e.target.value);
			}
		});
	}
}

class NameInput {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
		this.changeCallback = null;
	}

	getValue() {
		return this.element.value;
	}

	setValue(name) {
		this.element.value = name;
	}

	onNameChange(callback) {
		this.changeCallback = callback;
		this.element.addEventListener('input', (e) => {
			if (this.changeCallback) {
				this.changeCallback(e.target.value);
			}
		});
	}
}

class OutputDisplay {
	constructor(elementId) {
		this.element = document.getElementById(elementId);
	}

	updateBookmarklet(bookmarklet) {
		// Placeholder implementation
		this.element.innerHTML = `<p>Bookmarklet ready: ${bookmarklet.name}</p>`;
	}

	showError(message) {
		this.element.innerHTML = `<p class="error">${message}</p>`;
	}

	clearError() {
		// Will be implemented in later tasks
	}

	showPlaceholder() {
		this.element.innerHTML = '<p class="placeholder">Enter JavaScript code to generate a bookmarklet</p>';
	}
}

class ValidationEngine {
	validateSyntax(code) {
		// Placeholder implementation
		return { isValid: true, errors: [] };
	}

	formatErrors(errors) {
		// Placeholder implementation
		return errors.map(error => `<p>${error.message}</p>`).join('');
	}
}

class BookmarkletGenerator {
	generate(code, name) {
		// Placeholder implementation
		return { name, code, url: `javascript:${encodeURIComponent(code)}` };
	}
}

// Initialize the application
new BookmarkletApp();
