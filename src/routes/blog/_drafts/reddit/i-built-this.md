---
title: I built an all-in-one media tracker because I was tired of using Goodreads, Letterboxd, and Backloggd separately
subreddit: r/SideProject
also: r/indiehackers, r/webdev
status: draft
---

At some point last year I realized I was maintaining accounts on five different apps just to track the stuff I consume. Goodreads for books. Letterboxd for movies. Backloggd for games. A Notes app list for TV shows. A mental list for podcasts that I would immediately forget.

None of them talk to each other. They all have different UIs, different rating systems, different ways of organizing things. I could never answer the simple question: "what am I in the middle of right now, across everything?"

So I built BacklogBox.

The core idea is Kanban boards for all your media. Books, movies, TV series, games, podcasts — each gets its own board with columns you can customize. Drag something from Wishlist to In Progress when you start it. Drag it to Completed when you finish. Simple as that.

The thing that makes it actually usable (instead of just another list app) is that it pulls from real databases. Search for a movie and it finds it on TMDB. Books come from OpenLibrary. Games from IGDB. Podcasts from Apple Podcasts. You are not manually typing in titles and cover art — you search, click, and it lands on your board.

A few other things I am proud of: you can create custom lists for stuff that does not fit the main categories. I use one for restaurants I want to try and another for wine I have had. There are public profiles so you can share your boards with friends. And there is a Discover page with trending titles, recommendations, and upcoming releases across all media types.

I should be honest about what it is NOT. It is not a social network. There is no community review system like Letterboxd has. There is no auto-scrobbling like Trakt. It does not replace the depth of any single-media tracker — it replaces the breadth problem of needing five of them.

Built with SvelteKit, which has been a joy to work with for this kind of interactive, drag-heavy UI.

It is at backlogbox.com — there is a 14-day free trial, no credit card required, so you can see if it fits your workflow before committing. After that it is $9.99/mo or $99/yr.

I would genuinely love feedback, especially on what feels missing or clunky. I have been heads-down building this for a while and fresh eyes always catch things I have gone blind to.
