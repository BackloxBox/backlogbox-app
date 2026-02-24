<script lang="ts">
	import type { BlogPost } from '$lib/blog/posts';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';

	interface FaqItem {
		readonly question: string;
		readonly answer: string;
	}

	interface Props {
		/** Blog post metadata from `getPost()` */
		post: BlogPost;
		/** FAQ items rendered in both JSON-LD and the visual FAQ section */
		faqItems: readonly FaqItem[];
		/** Short breadcrumb label (defaults to post.title) */
		breadcrumbLabel?: string;
	}

	const { post, faqItems, breadcrumbLabel }: Props = $props();

	const siteUrl = 'https://backlogbox.com';
	const pageUrl = `${siteUrl}/blog/${post.slug}`;
	const ogImage = `${siteUrl}/blog/${post.slug}/og.png`;
</script>

<svelte:head>
	<title>{post.title} | BacklogBox Blog</title>
	<meta name="description" content={post.description} />
	<meta name="keywords" content={post.keywords.join(', ')} />
	<link rel="canonical" href={pageUrl} />

	<meta property="og:type" content="article" />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={post.description} />
	<meta property="og:url" content={pageUrl} />
	<meta property="article:published_time" content={post.publishedAt} />
	<meta property="article:modified_time" content={post.updatedAt} />

	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={post.title} />
	<meta name="twitter:description" content={post.description} />
	<meta name="twitter:image" content={ogImage} />

	<!-- BreadcrumbList: Home > Blog > Post -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
			{ '@type': 'ListItem', position: 3, name: post.title, item: pageUrl }
		]
	})}</${'script'}>`}

	<!-- Article -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		description: post.description,
		image: ogImage,
		datePublished: post.publishedAt,
		dateModified: post.updatedAt,
		author: { '@type': 'Organization', name: 'BacklogBox' },
		publisher: { '@type': 'Organization', name: 'BacklogBox', url: siteUrl },
		mainEntityOfPage: pageUrl
	})}</${'script'}>`}

	<!-- FAQPage -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD -->
	{@html `<${'script'} type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: { '@type': 'Answer', text: item.answer }
		}))
	})}</${'script'}>`}
</svelte:head>

<!-- Visual breadcrumb -->
<nav class="mb-8 text-xs text-muted-foreground/60">
	<a href="/" class="transition-colors hover:text-foreground">Home</a>
	<span class="mx-1.5">/</span>
	<a href="/blog" class="transition-colors hover:text-foreground">Blog</a>
	<span class="mx-1.5">/</span>
	<span class="text-foreground">{breadcrumbLabel ?? post.title}</span>
</nav>

<!-- Header -->
<header class="mb-10">
	<h1 class="text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
		{post.title}
	</h1>
	<div class="mt-4 flex items-center gap-4 text-xs text-muted-foreground/60">
		<span class="inline-flex items-center gap-1">
			<Calendar class="size-3" />
			{new Date(post.publishedAt).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</span>
		<span class="inline-flex items-center gap-1">
			<Clock class="size-3" />
			{post.readingTime}
		</span>
	</div>
</header>
