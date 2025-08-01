// Bookmarklet Generator Application
// Simple implementation using CodeMirror for code editing

class BookmarkletApp {
	constructor() {
		this.editor = null;
		this.nameInput = null;
		this.outputDisplay = null;
		this.debounceTimer = null;

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

	async initializeComponents() {
		// Initialize CodeMirror editor
		await this.initializeEditor();

		// Initialize other UI components
		this.nameInput = document.getElementById('bookmarklet-name');
		this.outputDisplay = document.getElementById('bookmarklet-output');

		// Set up event handlers
		this.setupEventHandlers();

		console.log('Bookmarklet Generator initialized');
	}

	async initializeEditor() {
		// Wait for CodeMirror modules to load
		let attempts = 0;
		while (!window.CodeMirror && attempts < 50) {
			await new Promise(resolve => setTimeout(resolve, 100));
			attempts++;
		}

		if (!window.CodeMirror) {
			console.error('CodeMirror failed to load');
			return;
		}

		try {
			const { EditorView, basicSetup } = window.CodeMirror;
			const { javascript } = window.CodeMirrorLangJavaScript || {};
			
			const extensions = [basicSetup];
			
			// Add JavaScript language support if available
			if (javascript) {
				extensions.push(javascript());
			}

			// Add update listener
			extensions.push(EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					this.handleCodeChange(this.editor.state.doc.toString());
				}
			}));

			this.editor = new EditorView({
				doc: '// Enter your JavaScript code here\nalert("Hello from bookmarklet!");',
				extensions,
				parent: document.getElementById('code-editor')
			});
		} catch (error) {
			console.error('Failed to initialize CodeMirror:', error);
			// Fallback to textarea
			this.createFallbackEditor();
		}
	}

	createFallbackEditor() {
		const container = document.getElementById('code-editor');
		container.innerHTML = `
			<textarea 
				id="fallback-editor" 
				placeholder="Enter your JavaScript code here..." 
				style="width: 100%; height: 300px; font-family: monospace;"
			>// Enter your JavaScript code here
alert("Hello from bookmarklet!");</textarea>
		`;
		
		const textarea = document.getElementById('fallback-editor');
		textarea.addEventListener('input', (e) => {
			this.handleCodeChange(e.target.value);
		});

		this.editor = {
			state: {
				doc: {
					toString: () => textarea.value
				}
			}
		};
	}

	setupEventHandlers() {
		// Name input change handler
		if (this.nameInput) {
			this.nameInput.addEventListener('input', () => {
				this.updateOutput();
			});
		}
	}

	handleCodeChange(code) {
		// Debounce validation
		clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => {
			this.validateAndUpdate(code);
		}, 300);
	}

	validateAndUpdate(code) {
		// Clear previous errors
		this.clearErrors();

		if (!code.trim()) {
			this.showPlaceholder();
			return;
		}

		// Basic syntax validation
		try {
			// Try to parse the JavaScript to check for syntax errors
			new Function(code);
			this.updateOutput();
		} catch (error) {
			this.showErrors([{ message: `Syntax Error: ${error.message}` }]);
		}
	}

	updateOutput() {
		const code = this.editor ? this.editor.state.doc.toString() : '';
		const name = this.nameInput?.value || 'Custom Bookmarklet';

		if (!code.trim()) {
			this.showPlaceholder();
			return;
		}

		try {
			const bookmarklet = this.generateBookmarklet(code);
			this.displayBookmarklet(name, bookmarklet);
		} catch (error) {
			this.showErrors([{ message: error.message }]);
		}
	}

	generateBookmarklet(code) {
		// Simple bookmarklet generation
		// Remove comments and extra whitespace
		const cleanCode = code
			.replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
			.replace(/\/\/.*$/gm, '') // Remove single-line comments
			.replace(/\s+/g, ' ') // Replace multiple whitespace with single space
			.trim();

		// Wrap in IIFE and encode
		const wrappedCode = `(function(){${cleanCode}})();`;
		return `javascript:${encodeURIComponent(wrappedCode)}`;
	}

	displayBookmarklet(name, bookmarkletCode) {
		const escapedName = this.escapeHtml(name);
		const displayCode = bookmarkletCode.length > 100 
			? bookmarkletCode.substring(0, 100) + '...' 
			: bookmarkletCode;

		this.outputDisplay.innerHTML = `
			<div class="bookmarklet-result">
				<h3>Ready to use:</h3>
				<div class="bookmarklet-container">
					<a href="${bookmarkletCode}" class="bookmarklet-link" draggable="true">${escapedName}</a>
					<button class="copy-button" type="button" onclick="copyToClipboard('${bookmarkletCode.replace(/'/g, "\\'")}')">
						Copy Code
					</button>
				</div>
				<div class="instructions">
					<p><strong>To install:</strong> Drag the link above to your bookmarks bar, or right-click and "Add to bookmarks"</p>
				</div>
				<details class="code-details">
					<summary>View generated code</summary>
					<pre><code>${this.escapeHtml(displayCode)}</code></pre>
				</details>
			</div>
		`;
	}

	showPlaceholder() {
		this.outputDisplay.innerHTML = '<p class="placeholder">Enter JavaScript code to generate a bookmarklet</p>';
	}

	showErrors(errors) {
		const errorDisplay = document.getElementById('error-display');
		if (!errorDisplay) return;

		const errorHtml = errors.map(error => 
			`<div class="error-item">${this.escapeHtml(error.message)}</div>`
		).join('');

		errorDisplay.innerHTML = errorHtml;
		errorDisplay.classList.remove('hidden');
	}

	clearErrors() {
		const errorDisplay = document.getElementById('error-display');
		if (!errorDisplay) return;

		errorDisplay.innerHTML = '';
		errorDisplay.classList.add('hidden');
	}

	escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}
}

// Global copy function for the copy button
function copyToClipboard(text) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text).then(() => {
			console.log('Copied to clipboard');
			// You could add a visual feedback here
		}).catch(err => {
			console.error('Failed to copy: ', err);
			fallbackCopyTextToClipboard(text);
		});
	} else {
		fallbackCopyTextToClipboard(text);
	}
}

function fallbackCopyTextToClipboard(text) {
	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		document.execCommand('copy');
		console.log('Fallback: Copied to clipboard');
	} catch (err) {
		console.error('Fallback: Could not copy text: ', err);
	}

	document.body.removeChild(textArea);
}

// Initialize the application
new BookmarkletApp();
