import type { ExternalSongDetails, MusicProvider, ProviderSong } from './types'

/**
 * EmilsTabs provider – community-driven Phish and Jam Band tabs.
 * Accesses content via the GitHub API from emilstabs/emilstabs repo.
 */
const GITHUB_REPO = 'emilstabs/emilstabs'
const CONTENT_BASE = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/files/tabs'
const RAW_BASE = 'https://raw.githubusercontent.com/' + GITHUB_REPO + '/master/files/tabs'

export const emilsTabsProvider: MusicProvider = {
    name: 'EmilsTabs',

    async search(query: string): Promise<ProviderSong[]> {
        try {
            // GitHub Search API is better for searching across file contents/names
            const searchParams = new URLSearchParams({
                q: `${query} repo:${GITHUB_REPO} path:files/tabs extension:txt`,
            })
            const res = await fetch(`https://api.github.com/search/code?${searchParams}`)
            if (!res.ok) throw new Error(`EmilsTabs search failed: ${res.status}`)

            const data = await res.json()
            const items: any[] = data.items ?? []

            return items.map((item: any) => {
                // Filename is usually "Artist - Song.txt" or just "Song.txt"
                // We'll try to parse artist if available, else use filename
                const filename = item.name.replace('.txt', '')
                const parts = filename.split(' - ')
                const artist = parts.length > 1 ? parts[0] : 'Phish' // Default to Phish if no dash
                const title = parts.length > 1 ? parts[1] : filename

                return {
                    providerId: item.path,
                    provider: 'EmilsTabs',
                    title: title,
                    artist: artist,
                    url: `https://emilstabs.org/tabs/${encodeURIComponent(item.name)}`,
                    cachedMetadata: {
                        album: 'EmilsTabs Archive'
                    }
                }
            })
        } catch (err) {
            console.error('[EmilsTabs] search failed:', err)
            return []
        }
    },

    async getDetails(providerId: string): Promise<ProviderSong | null> {
        // Usually providerId is the path in the repo
        const filename = providerId.split('/').pop()?.replace('.txt', '') || 'Unknown'
        const parts = filename.split(' - ')
        const artist = parts.length > 1 ? parts[0] : 'Phish'
        const title = parts.length > 1 ? parts[1] : filename

        return {
            providerId: providerId,
            provider: 'EmilsTabs',
            title: title,
            artist: artist,
            url: `https://emilstabs.org/tabs/${encodeURIComponent(filename + '.txt')}`,
        }
    },

    async getSongDetails(providerId: string): Promise<ExternalSongDetails | null> {
        try {
            // providerId is the path like "files/tabs/Phish - Tweezer.txt"
            const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${providerId}`)
            if (!res.ok) return null

            const data = await res.json()
            // GitHub returns base64 for file contents
            const content = atob(data.content.replace(/\s/g, ''))

            const filename = data.name.replace('.txt', '')
            const parts = filename.split(' - ')
            const artist = parts.length > 1 ? parts[0] : 'Phish'
            const title = parts.length > 1 ? parts[1] : filename

            return {
                id: providerId,
                provider: 'EmilsTabs',
                title: title,
                artist: artist,
                lyrics: content, // We treat the whole tab as "lyrics" (pre-formatted text)
                attributionUrl: `https://emilstabs.org/tabs/${encodeURIComponent(data.name)}`
            }
        } catch (err) {
            console.error('[EmilsTabs] failed to get song details:', err)
            return null
        }
    }
}
