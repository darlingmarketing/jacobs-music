import type { ExternalSongDetails, MusicProvider, ProviderSong } from './types'

/**
 * JDarks provider – niche Grateful Dead and Bluegrass transcriptions.
 * Indexes PDFs directly from jdarks.com downloads.
 * 
 * Note: PDF content extraction happens on the client if possible, 
 * but primarily provides high-quality links.
 */
const JDARKS_BASE = 'https://jdarks.com'

// A small subset for initial indexing logic – ideally this would be crawled or fetched from a JSON index
const JDARKS_DEAD_LINKS = [
    { title: 'Aiko Aiko', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/AikoAiko.pdf' },
    { title: 'Althea', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Althea.pdf' },
    { title: 'Bertha', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Bertha.pdf' },
    { title: 'Bird Song', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/BirdSong.pdf' },
    { title: 'Black Muddy River', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/BlackMuddyRiver.pdf' },
    { title: 'Box Of Rain', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/BoxOfRain.pdf' },
    { title: 'Brokedown Palace', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/BrokedownPalace.pdf' },
    { title: 'Brown Eyed Women', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/BrownEyedWomen.pdf' },
    { title: 'Candyman', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Candyman.pdf' },
    { title: 'Cassidy', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Cassidy.pdf' },
    { title: 'Casey Jones', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/CaseyJones.pdf' },
    { title: 'China Cat Sunflower', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/ChinaCatSunflower.pdf' },
    { title: 'Cumberland Blues', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/CumberlandBlues.pdf' },
    { title: 'Dark Star', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/DarkStar.pdf' },
    { title: 'Deal', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Deal.pdf' },
    { title: 'Eyes Of The World', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/EyesOfTheWorld.pdf' },
    { title: 'Franklin\'s Tower', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/FranklinsTower.pdf' },
    { title: 'Friend Of The Devil', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/FriendOfTheDevil.pdf' },
    { title: 'Going Down The Road Feeling Bad', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/GoingDownTheRoadFeelingBad.pdf' },
    { title: 'He\'s Gone', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/HesGone.pdf' },
    { title: 'Help On The Way', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/HelpOnTheWay.pdf' },
    { title: 'I Know You Rider', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/IKnowYouRider.pdf' },
    { title: 'Jack Straw', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/JackStraw.pdf' },
    { title: 'Loose Lucy', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/LooseLucy.pdf' },
    { title: 'Loser', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Loser.pdf' },
    { title: 'Mississippi Half-Step', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/MississippiHalfStep.pdf' },
    { title: 'Morning Dew', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/MorningDew.pdf' },
    { title: 'New Speedway Boogie', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/NewSpeedwayBoogie.pdf' },
    { title: 'Not Fade Away', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/NotFadeAway.pdf' },
    { title: 'One More Saturday Night', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/OneMoreSaturdayNight.pdf' },
    { title: 'Playing In The Band', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/PlayingInTheBand.pdf' },
    { title: 'Ripple', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Ripple.pdf' },
    { title: 'Row Jimmy', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/RowJimmy.pdf' },
    { title: 'Scarlet Begonias', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/ScarletBegonias.pdf' },
    { title: 'Ship Of Fools', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/ShipOfFools.pdf' },
    { title: 'St. Stephen', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/StStephen.pdf' },
    { title: 'Stella Blue', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/StellaBlue.pdf' },
    { title: 'Sugar Magnolia', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/SugarMagnolia.pdf' },
    { title: 'Sugaree', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Sugaree.pdf' },
    { title: 'Tennessee Jed', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/TennesseeJed.pdf' },
    { title: 'Terrapin Station', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/TerrapinStation.pdf' },
    { title: 'The Other One', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/TheOtherOne.pdf' },
    { title: 'The Wheel', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/TheWheel.pdf' },
    { title: 'They Love Each Other', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/TheyLoveEachOther.pdf' },
    { title: 'Truckin\'', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/Truckin.pdf' },
    { title: 'Uncle John\'s Band', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/UncleJohnsBand.pdf' },
    { title: 'US Blues', url: 'https://img1.wsimg.com/blobby/go/d1ef9b66-7764-42bb-89ef-b2ce80022f37/downloads/USBlues.pdf' },
]

export const jDarksProvider: MusicProvider = {
    name: 'JDarks',

    async search(query: string): Promise<ProviderSong[]> {
        const q = query.toLowerCase()
        const matches = JDARKS_DEAD_LINKS.filter(s => s.title.toLowerCase().includes(q))

        return matches.map(s => ({
            providerId: s.url,
            provider: 'JDarks',
            title: s.title,
            artist: 'Grateful Dead',
            url: s.url,
            cachedMetadata: {
                album: 'JDarks Transcriptions'
            }
        }))
    },

    async getDetails(providerId: string): Promise<ProviderSong | null> {
        const song = JDARKS_DEAD_LINKS.find(s => s.url === providerId)
        if (!song) return null

        return {
            providerId: song.url,
            provider: 'JDarks',
            title: song.title,
            artist: 'Grateful Dead',
            url: song.url,
        }
    },

    async getSongDetails(providerId: string): Promise<ExternalSongDetails | null> {
        const song = JDARKS_DEAD_LINKS.find(s => s.url === providerId)
        if (!song) return null

        return {
            id: song.url,
            provider: 'JDarks',
            title: song.title,
            artist: 'Grateful Dead',
            attributionUrl: song.url,
            lyrics: '[PDF Transcription Available - View External ↗]'
        }
    }
}
