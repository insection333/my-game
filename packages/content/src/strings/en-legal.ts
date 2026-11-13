// The privacy page and the terms of use, in plain words. Each page's body is its sections in order,
// separated by blank lines: a heading on the first line of each, then its paragraph.

export const legal: Record<string, string> = {
  'legal.contact': 'Contact: {address}',
  'legal.privacy.title': 'Privacy',
  'legal.privacy.updated': 'Last changed 7 November 2026',
  'legal.privacy.body': [
    'What we keep\nYour player name, your password (only as a one-way hash, never the password itself), your game save, the notices in your tray and your place on the hiscores. We do not ask for your real name, your email address or your age, beyond your word that you are 13 or older.',
    'How it is used\nTo run your game: your lanes keep working while you are away because your save is kept on our server. Your player name and levels are shown to other players on the hiscores.',
    'Game statistics\nWe count what happens in the game (levels, finds, why a lane stopped, when people sign in, which days you played) to make it better. These counts hold an anonymous player number, never your name, your address or anything you typed.',
    'Feedback you send\nIf you send feedback from Settings, we keep what you wrote, the page you were on and when, with your account, so the team can read it and reply in the game. Apart from your messages (below), nothing else you type is kept.',
    'Messages\nA message you send to another player is kept in their inbox until they delete it: a read one for at most a week, an unread one for at most two. Blocking a player only stops their messages reaching you.',
    'Reports\nIf you report a player, we keep who reported whom, for what (an offensive name, or cheating and abuse) and when, so an admin can look into it; the player reported is not told who reported them. Sieges between lords in Castle Clash are kept for 30 days, so an admin can spot an account feeding another.',
    'One cookie\nA single cookie keeps you signed in for 30 days. There are no advertising or tracking cookies, and nothing is shared with other companies.',
    'Your address on the internet\nYour connection address is used for a short while to stop people guessing passwords or flooding sign-ups. It is not stored with your account.',
    'Deleting your account\nYou can delete your account from Settings at any time. Everything we hold about you goes at once: your account, your save, your notices, the messages you sent and received, your hiscores, your game statistics, any feedback you sent, and any reports you made or that were made about you.',
    'Questions\nWrite to admin@idleclash.com.',
  ].join('\n\n'),
  'legal.terms.title': 'Terms of use',
  'legal.terms.updated': 'Last changed 14 November 2026',
  'legal.terms.body': [
    'Who can play\nYou must be 13 or older to make an account. One account per person.',
    'Your name\nChoose a name others will be glad to see on the hiscores. We may rename an account whose name is offensive, or that passes for the game or its team.',
    'Play fair\nPlay with your own hands: no scripts or programs that play for you, no exploiting bugs (tell us instead), no second account to feed your first, and no attempts to break or overload the game. Accounts that do may be banned. If you see a player doing this, or an offensive name, tap their name on the hiscores or in Castle Clash and choose Report this player.',
    'Messages\nYou can send short messages to other players. Keep them friendly: no insults, harassment, threats, foul language, or tricks to get past the language filter. To keep the game safe for everyone, our moderators can read the messages players send, and the ones the filter stops (which are kept for 30 days). A player who breaks these rules may be warned, stopped from sending messages, or banned. Anyone can block you from writing to them.',
    'The game changes\nThe game is being built and will change: numbers are balanced, things are added, and now and then something breaks. Nothing in the game has money value, and there is nothing to buy.',
    'Your account\nKeep your password to yourself. If you forget it, write to admin@idleclash.com with your player name and an admin can help you set a new one. You can delete your account from Settings whenever you like.',
    'As it is\nThe game is offered as it is, without promises that it will always be available or free of mistakes. We do our best to keep your save safe.',
  ].join('\n\n'),
};
