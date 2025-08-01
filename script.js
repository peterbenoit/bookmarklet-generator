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
		this.librariesInput = document.getElementById('bookmarklet-libraries');
		this.outputDisplay = document.getElementById('bookmarklet-output');

		// Set up event handlers
		this.setupEventHandlers();
	}

	async initializeEditor() {
		const editorContainer = document.getElementById('code-editor');

		if (!window.CodeMirror) {
			console.error('CodeMirror not loaded, using fallback');
			this.createFallbackEditor();
			return;
		}

		try {
			this.editor = CodeMirror(editorContainer, {
				value: '// Enter your JavaScript code here',
				mode: 'javascript',
				theme: 'monokai',
				lineNumbers: true,
				autoCloseBrackets: true,
				matchBrackets: true,
				indentUnit: 2,
				tabSize: 2,
				lineWrapping: true,
				extraKeys: {
					"Ctrl-Space": "autocomplete"
				}
			});

			// Listen for changes
			this.editor.on('change', (instance) => {
				this.handleCodeChange(instance.getValue());
			});

		} catch (error) {
			console.error('Failed to initialize CodeMirror:', error);
			this.createFallbackEditor();
		}
	} createFallbackEditor() {
		const container = document.getElementById('code-editor');
		container.innerHTML = `
			<textarea
				id="fallback-editor"
				placeholder="Enter your JavaScript code here..."
				style="width: 100%; height: 300px; font-family: monospace;"
			>// Enter your JavaScript code here
			</textarea>
		`;

		const textarea = document.getElementById('fallback-editor');
		textarea.addEventListener('input', (e) => {
			this.handleCodeChange(e.target.value);
		});

		// Create a simple interface for getting the value
		this.editor = {
			getValue: () => textarea.value,
			setValue: (val) => { textarea.value = val; }
		};
	}

	setupEventHandlers() {
		// Name input change handler
		if (this.nameInput) {
			this.nameInput.addEventListener('input', () => {
				this.updateOutput();
			});
		}

		// Libraries input change handler
		if (this.librariesInput) {
			this.librariesInput.addEventListener('input', () => {
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
		const code = this.editor ? this.editor.getValue() : '';
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
		// Get libraries from input
		const librariesText = this.librariesInput?.value || '';
		const libraries = librariesText
			.split('\n')
			.map(url => url.trim())
			.filter(url => url && url.startsWith('http'));

		// Separate JS and CSS libraries
		const jsLibraries = libraries.filter(url => url.endsWith('.js') || (!url.endsWith('.css') && !url.includes('.css')));
		const cssLibraries = libraries.filter(url => url.endsWith('.css') || url.includes('.css'));

		// Clean the main code
		const cleanCode = code
			.replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
			.replace(/\/\/.*$/gm, '') // Remove single-line comments
			.replace(/\s+/g, ' ') // Replace multiple whitespace with single space
			.trim();

		let wrappedCode;

		if (libraries.length > 0) {
			// Generate library loading code with modern approach
			const libraryLoadingCode = this.generateLibraryLoader(jsLibraries, cssLibraries, cleanCode);
			wrappedCode = `(function(){${libraryLoadingCode}})();`;
		} else {
			// Simple bookmarklet without libraries
			wrappedCode = `(function(){${cleanCode}})();`;
		}

		return `javascript:${encodeURIComponent(wrappedCode)}`;
	}

	generateLibraryLoader(jsLibraries, cssLibraries, userCode) {
		// Modern library loading approach using Promises
		const jsUrls = jsLibraries.map(url => `"${url.replace(/"/g, '\\"')}"`).join(',');
		const cssUrls = cssLibraries.map(url => `"${url.replace(/"/g, '\\"')}"`).join(',');

		return `
			function loadScript(src) {
				return new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.src = src;
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}

			function loadCSS(href) {
				return new Promise((resolve, reject) => {
					const link = document.createElement('link');
					link.rel = 'stylesheet';
					link.href = href;
					link.onload = resolve;
					link.onerror = reject;
					document.head.appendChild(link);
				});
			}

			function loadLibraries(jsUrls, cssUrls) {
				const promises = [];
				if (jsUrls.length > 0) {
					promises.push(...jsUrls.map(loadScript));
				}
				if (cssUrls.length > 0) {
					promises.push(...cssUrls.map(loadCSS));
				}
				return Promise.all(promises);
			}

			const jsLibraries = [${jsUrls}];
			const cssLibraries = [${cssUrls}];

			if (jsLibraries.length > 0 || cssLibraries.length > 0) {
				loadLibraries(jsLibraries, cssLibraries)
					.then(() => {
						${userCode}
					})
					.catch(err => {
						console.error('Failed to load libraries:', err);
						alert('Failed to load one or more libraries. Check console for details.');
					});
			} else {
				${userCode}
			}
		`.replace(/\s+/g, ' ').trim();
	}

	displayBookmarklet(name, bookmarkletCode) {
		const escapedName = this.escapeHtml(name);
		const displayCode = bookmarkletCode.length > 200
			? bookmarkletCode.substring(0, 200) + '...'
			: bookmarkletCode;

		// Get libraries info
		const librariesText = this.librariesInput?.value || '';
		const libraries = librariesText
			.split('\n')
			.map(url => url.trim())
			.filter(url => url && url.startsWith('http'));

		const librariesInfo = libraries.length > 0
			? `<div class="libraries-info" style="margin: 10px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
				<p><strong>External Libraries (${libraries.length}):</strong></p>
				<ul style="margin: 5px 0 0 20px; font-size: 0.9em;">
					${libraries.map(url => `<li>${this.escapeHtml(url)}</li>`).join('')}
				</ul>
			</div>`
			: '';

		this.outputDisplay.innerHTML = `
			<div class="bookmarklet-result">
				<h3>Ready to use:</h3>
				<div class="bookmarklet-container" style="margin: 15px 0; padding: 15px; border: 2px dashed #007acc; border-radius: 8px; background: #f8f9fa;">
					<a href="${bookmarkletCode}"
					   class="bookmarklet-link"
					   draggable="true"
					   style="display: inline-block; padding: 10px 15px; background: #007acc; color: white; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold;"
					   title="Drag this to your bookmarks bar">${escapedName}</a>
				</div>
				${librariesInfo}
				<button class="copy-button"
						type="button"
						onclick="copyToClipboard('${bookmarkletCode.replace(/'/g, "\\'")}', this)"
						style="padding: 10px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
					Copy Code
				</button>
				<div class="instructions" style="margin: 10px 0; padding: 10px; background: #e7f3ff; border-radius: 5px;">
					<p><strong>To install:</strong> Drag the blue link above to your bookmarks bar, or right-click and "Add to bookmarks"</p>
					${libraries.length > 0 ? '<p><strong>Note:</strong> This bookmarklet will load external libraries before executing your code.</p>' : ''}
				</div>
				<button class="view-code-button"
						type="button"
						onclick="showCodeModal('${bookmarkletCode.replace(/'/g, "\\'")}')"
						style="margin-top: 15px; padding: 10px 15px; background: #f1f1f1; color: #1d1d1f; border: 1px solid #d1d1d6; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s ease;">
					View generated code
				</button>
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
function copyToClipboard(text, buttonElement) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text).then(() => {

			// Simple visual feedback
			const button = buttonElement;
			const originalText = button.textContent;
			button.textContent = 'Copied!';
			button.style.background = '#218838';
			setTimeout(() => {
				button.textContent = originalText;
				button.style.background = '#28a745';
			}, 1500);
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

	} catch (err) {
		console.error('Fallback: Could not copy text: ', err);
	}

	document.body.removeChild(textArea);
}

// Modal functionality
function showCodeModal(code) {
	const modal = document.getElementById('code-modal');
	const codeContent = document.getElementById('modal-code-content');

	if (modal && codeContent) {
		// Set the code content
		codeContent.querySelector('code').textContent = code;

		// Show the modal
		modal.classList.add('show');
		modal.setAttribute('aria-hidden', 'false');

		// Focus the close button for accessibility
		const closeButton = modal.querySelector('.modal-close');
		if (closeButton) {
			closeButton.focus();
		}

		// Prevent body scrolling
		document.body.style.overflow = 'hidden';
	}
}

function hideCodeModal() {
	const modal = document.getElementById('code-modal');

	if (modal) {
		modal.classList.remove('show');
		modal.setAttribute('aria-hidden', 'true');

		// Restore body scrolling
		document.body.style.overflow = '';
	}
}

// Set up modal event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
	const modal = document.getElementById('code-modal');
	const closeButton = modal?.querySelector('.modal-close');

	// Close button click
	if (closeButton) {
		closeButton.addEventListener('click', hideCodeModal);
	}

	// Click outside modal to close
	if (modal) {
		modal.addEventListener('click', function (e) {
			if (e.target === modal) {
				hideCodeModal();
			}
		});
	}

	// Escape key to close
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && modal?.classList.contains('show')) {
			hideCodeModal();
		}
	});
});

// Initialize the application
new BookmarkletApp();
