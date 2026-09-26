import { logoBase64 } from '$lib/assets/logo-base64.js';
import { escapeHtml } from './escape.js';
import { OG_CONSTANTS, type LayoutConfig } from './layouts.js';

/**
 * Create base container with common background and styling
 */
function createBaseContainer(children: string, additionalStyles = ''): string {
	// Il noise NON è qui: lo applica sharp dopo il render (vedi generate-og-images.ts),
	// per non far processare a satori/resvg un data-URI da 170KB su ogni immagine.
	return `
		<div style="
			width: ${OG_CONSTANTS.WIDTH}px;
			height: ${OG_CONSTANTS.HEIGHT}px;
			position: relative;
			background: transparent;
			font-family: '${OG_CONSTANTS.FONTS.FAMILY}';
			${additionalStyles}
		">
			${children}
		</div>
	`;
}

/**
 * Sfondo gradiente da solo (senza contenuto): renderizzato una volta e usato come
 * base su cui applicare il noise, SOTTO al contenuto delle altre layout.
 */
export function createGradientBackgroundHtml(): string {
	return `
		<div style="
			display: flex;
			width: ${OG_CONSTANTS.WIDTH}px;
			height: ${OG_CONSTANTS.HEIGHT}px;
			background: linear-gradient(135deg, ${OG_CONSTANTS.COLORS.GRADIENT.START} 0%, ${OG_CONSTANTS.COLORS.GRADIENT.MID} 50%, ${OG_CONSTANTS.COLORS.GRADIENT.END} 100%);
		"></div>
	`;
}

/**
 * Create home page layout as HTML for OG preview
 */
export function createHomeHtml(): string {
	const content = `
		<div style="
			display: flex;
			align-items: flex-end;
			gap: 10px;
			position: relative;
		">
			<img src="${logoBase64}" style="width: 180px; height: 180px; display: block;" />
			<div style="
				display: flex;
				flex-direction: column;
				margin-bottom: -3px;
			">
				<span style="
					font-size: 72px;
					font-weight: 500;
					color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY};
					line-height: 1;
				">esse</span>
				<span style="
					font-size: 52px;
					color: ${OG_CONSTANTS.COLORS.TEXT.SECONDARY};
					line-height: 0.8;
					margin-top: -2px;
				">dev</span>
			</div>
		</div>
	`;

	return createBaseContainer(
		content,
		`
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	`
	);
}

/**
 * Create listing page layout as HTML for OG preview
 */
export function createListingHtml(title: string, subtitle?: string): string {
	// Wrap logo and text divs in a single flex wrapper
	const content = `
  <div style="
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
  ">
   <div style="
	  position: absolute;
	  top: 80px;
	  left: 80px;
	  display: flex;
	  align-items: flex-end;
	  gap: 6px;
	">
	  <img src="${logoBase64}" style="width: 80px; height: 80px;" />
	  <div style="
		display: flex;
		flex-direction: column;
		margin-bottom: -1px;
	  ">
		<span style="
		  font-size: 32px;
		  font-weight: 500;
		  color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY};
		  line-height: 1;
		">esse</span>
		<span style="
		  font-size: 24px;
		  color: ${OG_CONSTANTS.COLORS.TEXT.SECONDARY};
		  line-height: 0.8;
		  margin-top: 0px;
		">dev</span>
	  </div>
	</div>
	<div style="
	  position: absolute;
	  top: 50%;
	  left: 50%;
	  transform: translate(-50%, -50%);
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: center;
	  text-align: center;
	  width: ${OG_CONSTANTS.WIDTH - 160}px;
	">
	  <h1 style="
		font-size: 64px;
		font-weight: bold;
		color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY};
		margin: 0;
		line-height: 1.1;
	  ">${escapeHtml(title)}</h1>
	  ${
			subtitle
				? `
	  <p style="
		font-size: 24px;
		color: ${OG_CONSTANTS.COLORS.TEXT.MUTED};
		margin: 16px 0 0 0;
		line-height: 1.2;
	  ">${escapeHtml(subtitle)}</p>
	`
				: ''
		}
	</div>
  </div>
`;

	// Logo and text are positioned absolutely within the base container; set display:flex on container to satisfy renderer requirement
	return createBaseContainer(content, `display: flex;`);
}

/**
 * Create detail page layout as HTML for OG preview
 */
export function createDetailHtml(title: string, excerpt?: string, coverImage?: string): string {
	const hasImage = !!coverImage;

	if (hasImage) {
		// With image: 60/40 split
		const content = `
		<!-- Logo and brand text top-left -->
		<div style="
		  position: absolute;
		  top: 80px;
		  left: 80px;
		  display: flex;
		  align-items: flex-end;
		  gap: 6px;
		">
		  <img src="${logoBase64}" style="width: 80px; height: 80px;" />
		  <div style="display: flex; flex-direction: column; margin-bottom: -1px;">
		    <span style="font-size: 32px; font-weight:500; color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY}; line-height:1;">esse</span>
		    <span style="font-size: 24px; color: ${OG_CONSTANTS.COLORS.TEXT.SECONDARY}; line-height:0.8; margin-top:0px;">dev</span>
		  </div>
		</div>
		<div style="
		  width: 720px;
		  display: flex;
		  flex-direction: column;
		  justify-content: center;
		  padding: 80px 40px 80px 80px;
		  position: relative;
		  margin-top: 140px;
		">
		  <h1 style="
		    font-size: 48px;
		    font-weight: bold;
		    color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY};
		    margin: 0 0 24px 0;
		    line-height: 1.1;
		  ">${escapeHtml(title)}</h1>
		  ${
				excerpt
					? `
		  <p style="
		    font-size: 20px;
		    color: ${OG_CONSTANTS.COLORS.TEXT.MUTED};
		    margin: 0;
		    line-height: 1.4;
		  ">${escapeHtml(excerpt.length > 150 ? excerpt.slice(0, 150) + '...' : excerpt)}</p>
		`
					: ''
			}
		</div>
		
		<div style="
		  width: 480px;
		  display: flex;
		  align-items: center;
		  justify-content: center;
		  padding: 80px 80px 80px 40px;
		  position: relative;
		">
		  <img src="${coverImage}" style="width: 400px; height: 300px;
		    border-radius: 12px;
		    object-fit: cover;
		  " />
		</div>
		`;

		return createBaseContainer(content, 'display: flex;');
	} else {
		// Without image: placeholder with same layout as image variant
		const content = `
		<!-- Logo and brand text top-left -->
		<div style="
		  position: absolute;
		  top: 80px;
		  left: 80px;
		  display: flex;
		  align-items: flex-end;
		  gap: 6px;
		">
		  <img src="${logoBase64}" style="width: 80px; height: 80px;" />
		  <div style="display: flex; flex-direction: column; margin-bottom: -1px;">
		    <span style="font-size: 32px; font-weight:500; color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY}; line-height:1;">esse</span>
		    <span style="font-size: 24px; color: ${OG_CONSTANTS.COLORS.TEXT.SECONDARY}; line-height:0.8; margin-top:0px;">dev</span>
		  </div>
		</div>
		<div style="
		  display: flex;
		  position: relative;
		">
		  <div style="
		    width: 720px;
		    display: flex;
		    flex-direction: column;
		    justify-content: center;
		    padding: 80px 40px 80px 80px;
		  ">
		    <h1 style="
		      font-size: 48px;
		      font-weight: bold;
		      color: ${OG_CONSTANTS.COLORS.TEXT.PRIMARY};
		      margin: 0 0 24px 0;
		      line-height: 1.1;
		    ">${escapeHtml(title)}</h1>
		    ${
					excerpt
						? `
		    <p style="
		      font-size: 20px;
		      color: ${OG_CONSTANTS.COLORS.TEXT.MUTED};
		      margin: 0;
		      line-height: 1.4;
		    ">${escapeHtml(excerpt.length > 150 ? excerpt.slice(0, 150) + '...' : excerpt)}</p>
		  `
						: ''
				}
		  </div>
		  <div style="
		    width: 480px;
		    display: flex;
		    align-items: center;
		    justify-content: center;
		    padding: 80px 80px 80px 40px;
		  ">
		    <div style="
		      width: 400px;
		      height: 300px;
		      border-radius: 12px;
		      background: #e0e0e0;
		    "></div>
		  </div>
		</div>
		`;

		return createBaseContainer(content, 'display: flex;');
	}
}

/**
 * Generate HTML layout based on type and data
 */
export function generateHtmlLayout(config: LayoutConfig): string {
	switch (config.type) {
		case 'home':
			return createHomeHtml();
		case 'listing':
			return createListingHtml(config.title || 'Page', config.subtitle);
		case 'detail':
			return createDetailHtml(config.title || 'Article', config.excerpt, config.coverImage);
		default:
			return createHomeHtml();
	}
}
