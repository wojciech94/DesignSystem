/**
 * Tailwind CSS v3 preset for the Enterprise Automation Design System.
 *
 * MERGE into your existing `tailwind.config.ts` (do not replace the file —
 * it also carries your container settings, fonts and shadcn mappings).
 *
 *   import ds from './adapters/tailwind-preset'
 *   const config = { darkMode: ['class'], content: [...],
 *                    theme: { extend: { ...ds } } }
 *
 * © 2026 Wojciech Kokoszka · MIT License · full text: LICENSE
 * Requires Tailwind v3. For v4 use `@theme` in CSS instead and ignore this file.
 */

const ds = {
	// ---------------------------------------------------------------- surfaces
	colors: {
		canvas: 'var(--bg-canvas)',
		sunken: 'var(--bg-sunken)',
		surface: {
			DEFAULT: 'var(--bg-surface)',
			2: 'var(--bg-surface-2)',
			3: 'var(--bg-surface-3)',
		},
		raised: 'var(--bg-raised)',
		overlay: 'var(--bg-overlay)',
		inset: 'var(--bg-inset)',

		// ----------------------------------------------------------------- text
		content: {
			primary: 'var(--text-primary)',
			secondary: 'var(--text-secondary)',
			tertiary: 'var(--text-tertiary)',
			quaternary: 'var(--text-quaternary)',
			disabled: 'var(--text-disabled)',
			link: 'var(--text-link)',
			code: 'var(--text-code)',
		},

		// ---------------------------------------------------------------- brand
		brand: {
			DEFAULT: 'var(--accent)',
			hover: 'var(--accent-hover)',
			active: 'var(--accent-active)',
			subtle: 'var(--accent-muted)',
			border: 'var(--accent-border)',
			text: 'var(--accent-text)',
		},
		focus: 'var(--focus-ring)',

		// --------------------------------------------------------------- borders
		// IMPORTANT: `input` and `line.DEFAULT` are NOT interchangeable.
		//   --border-control  (#6b7b8d) 4.3:1 — required for the RESTING border
		//                              of any interactive control (WCAG 1.4.11)
		//   --border-default  (#27333f) 1.5:1 — decorative only, never a control
		input: 'var(--border-control)',
		line: {
			subtle: 'var(--border-subtle)',
			DEFAULT: 'var(--border-default)',
			strong: 'var(--border-strong)',
			control: 'var(--border-control)',
			accent: 'var(--accent-border)',
		},

		// --------------------------------------------------------------- status
		// Always pair colour with an icon or a word. Never colour alone.
		success: {
			DEFAULT: 'var(--success)',
			text: 'var(--success-text)',
			surface: 'var(--success-bg)',
			border: 'var(--success-bd)',
			solid: 'var(--success)',
		},
		warning: {
			DEFAULT: 'var(--warning)',
			text: 'var(--warning-text)',
			surface: 'var(--warning-bg)',
			border: 'var(--warning-bd)',
			solid: 'var(--warning)',
		},
		danger: {
			DEFAULT: 'var(--danger)',
			// Use `solid` for fills that carry light text. --danger (#de4040)
			// with white text is 4.27:1 and FAILS AA. --danger-solid is 5.22:1.
			solid: 'var(--danger-solid)',
			text: 'var(--danger-text)',
			surface: 'var(--danger-bg)',
			border: 'var(--danger-bd)',
		},
		info: {
			DEFAULT: 'var(--info)',
			text: 'var(--info-text)',
			surface: 'var(--info-bg)',
			border: 'var(--info-bd)',
		},
	},

	// ------------------------------------------------------------- typography
	// 14-step scale, DS-02. Body stops at 18px; this is a dense product.
	fontSize: {
		overline: ['0.656rem', { lineHeight: '1.3', letterSpacing: '0.14em' }], // 10.5px
		caption: ['0.781rem', { lineHeight: '1.5' }],                          // 12.5px
		'sm-caption': ['0.719rem', { lineHeight: '1.45' }],                    // 11.5px
		body: ['0.9375rem', { lineHeight: '1.6' }],                            // 15px
		'body-sm': ['0.844rem', { lineHeight: '1.58' }],                       // 13.5px
		'body-lg': ['1rem', { lineHeight: '1.68' }],                           // 16px
		lead: ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.012em' }],  // 18px
		h5: ['1rem', { lineHeight: '1.4', letterSpacing: '-0.008em' }],        // 16px
		h4: ['1.1875rem', { lineHeight: '1.32', letterSpacing: '-0.014em' }],  // 19px
		h3: ['1.5625rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],    // 25px
		h2: ['2rem', { lineHeight: '1.14', letterSpacing: '-0.026em' }],       // 32px
		h1: ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.032em' }],     // 40px
		display: ['4.25rem', { lineHeight: '1.03', letterSpacing: '-0.038em' }] // 68px
	},
	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
	},
	fontFamily: {
		sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
		mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
	},

	// --------------------------------------------------------------- spacing
	// 4px base grid. Tailwind's default scale is already 4px-based, so we only
	// add the steps the DS actually uses.
	//
	// NOTE on the 38px control height: it is the one deliberate deviation from
	// the 4px grid in this system (30 / 38 / 46 for sm / md / lg). It is
	// intentional and load-bearing — it is the height every control in the
	// board was measured and contrast-audited at. Do not "correct" it to 40px.
	spacing: {
		'0.75': '0.1875rem',  //  3px — nav active rail, micro gaps
		'2.75': '0.6875rem',  // 11px — button/sm inline padding
		'4.5': '1.125rem',    // 18px
		'5.5': '1.375rem',    // 22px — button/lg padding, badge height
		'7.5': '1.875rem',    // 30px — control/sm height
		'9.5': '2.375rem',    // 38px — control/md height (the DS anchor)
		'11.5': '2.875rem',   // 46px — control/lg height
		'18': '4.5rem',       // 72px
		'22': '5.5rem',       // 88px
		'30': '7.5rem',       // 120px
	},

	// ---------------------------------------------------------------- radius
	// One radius family per surface. Nested controls sit one step below parent.
	borderRadius: {
		xs: '3px',
		sm: '5px',
		md: '8px',
		lg: '12px',
		xl: '16px',
		'2xl': '22px',
	},

	// ------------------------------------------------------------- elevation
	// Dark mode needs deeper shadows than light; always pair with a border.
	boxShadow: {
		'ds-1': '0 1px 2px rgba(0,0,0,.5)',
		'ds-2': '0 2px 4px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.4)',
		'ds-3': '0 4px 8px rgba(0,0,0,.45), 0 2px 4px rgba(0,0,0,.35)',
		'ds-4': '0 10px 20px rgba(0,0,0,.5), 0 4px 8px rgba(0,0,0,.4)',
		'ds-5': '0 18px 36px rgba(0,0,0,.55), 0 8px 16px rgba(0,0,0,.45)',
		'ds-6': '0 32px 64px rgba(0,0,0,.6), 0 16px 32px rgba(0,0,0,.5)',
		'ds-focus': '0 0 0 3px rgba(31,111,235,.32)',
		'ds-hairline': 'inset 0 1px 0 rgba(255,255,255,.045)',
	},

	// ---------------------------------------------------------------- motion
	// 4 durations, 4 curves. Nothing exceeds 300ms.
	transitionDuration: {
		instant: '0ms',
		fast: '110ms',
		base: '160ms',
		slow: '260ms',
	},
	transitionTimingFunction: {
		standard: 'cubic-bezier(.4,0,.2,1)',
		entrance: 'cubic-bezier(0,0,.2,1)',
		exit: 'cubic-bezier(.4,0,1,1)',
		spring: 'cubic-bezier(.32,.72,0,1)',
	},

	// -------------------------------------------------------------- keyframes
	keyframes: {
		'ds-spin': { to: { transform: 'rotate(360deg)' } },
		'ds-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
		'ds-scale-in': {
			from: { opacity: '0', transform: 'scale(.96) translateY(8px)' },
			to: { opacity: '1', transform: 'scale(1) translateY(0)' },
		},
	},
	animation: {
		'spin-fast': 'ds-spin .7s linear infinite',
		'fade-in': 'ds-fade-in var(--duration-base) var(--ease-entrance)',
		'scale-in': 'ds-scale-in var(--duration-base) var(--ease-standard)',
	},
};

export default ds;
