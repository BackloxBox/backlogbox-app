import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getPost, posts } from '$lib/blog/posts';
import type { RequestHandler } from './$types';

export const prerender = true;

/** Provide all valid slugs so SvelteKit knows which paths to prerender. */
export function entries() {
	return posts.map((p) => ({ slug: p.slug }));
}

const WIDTH = 1200;
const HEIGHT = 630;

const fontsDir = join(process.cwd(), 'src', 'lib', 'og', 'fonts');

const geistRegular = readFileSync(join(fontsDir, 'Geist-Regular.otf'));
const geistSemiBold = readFileSync(join(fontsDir, 'Geist-SemiBold.otf'));

export const GET: RequestHandler = async ({ params }) => {
	const post = getPost(params.slug);
	if (!post) error(404, 'Post not found');

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '60px 64px',
					background: 'linear-gradient(145deg, #0c0c0f 0%, #111116 40%, #14141a 100%)',
					fontFamily: 'Geist'
				},
				children: [
					// Top: logo + site name
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								gap: '12px'
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											width: '32px',
											height: '32px',
											borderRadius: '8px',
											background: 'linear-gradient(135deg, #3b82f6, #22c55e)',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center'
										},
										children: [
											{
												type: 'span',
												props: {
													style: {
														fontSize: '18px',
														fontWeight: 600,
														color: 'white'
													},
													children: 'B'
												}
											}
										]
									}
								},
								{
									type: 'span',
									props: {
										style: {
											fontSize: '20px',
											fontWeight: 600,
											color: '#a1a1aa'
										},
										children: 'BacklogBox'
									}
								}
							]
						}
					},

					// Middle: title + description
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								flexDirection: 'column',
								gap: '20px',
								flex: '1',
								justifyContent: 'center'
							},
							children: [
								{
									type: 'h1',
									props: {
										style: {
											fontSize: post.title.length > 60 ? '40px' : '48px',
											fontWeight: 600,
											color: '#fafafa',
											lineHeight: 1.15,
											margin: 0,
											letterSpacing: '-0.02em'
										},
										children: post.title
									}
								},
								{
									type: 'p',
									props: {
										style: {
											fontSize: '20px',
											color: '#71717a',
											lineHeight: 1.5,
											margin: 0,
											maxWidth: '900px'
										},
										children:
											post.description.length > 140
												? post.description.slice(0, 137) + '...'
												: post.description
									}
								}
							]
						}
					},

					// Bottom: gradient accent bar + url
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between'
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											width: '80px',
											height: '4px',
											borderRadius: '2px',
											background: 'linear-gradient(90deg, #3b82f6, #22c55e, #f59e0b)'
										}
									}
								},
								{
									type: 'span',
									props: {
										style: {
											fontSize: '16px',
											color: '#52525b'
										},
										children: 'backlogbox.com'
									}
								}
							]
						}
					}
				]
			}
		},
		{
			width: WIDTH,
			height: HEIGHT,
			fonts: [
				{ name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
				{ name: 'Geist', data: geistSemiBold, weight: 600, style: 'normal' }
			]
		}
	);

	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: WIDTH }
	});

	const pngData = resvg.render().asPng();
	const arrayBuffer = pngData.buffer.slice(
		pngData.byteOffset,
		pngData.byteOffset + pngData.byteLength
	) as ArrayBuffer;

	return new Response(arrayBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
